import React, { PureComponent } from 'react'
import { ActivityIndicator, StyleSheet, View, ScrollView, Text, Dimensions } from 'react-native'
import { Field, DefaultHeaderHOC, SelectBox } from '../components'
import { AlertHelper, BLEService, getStatusBarHeight } from '../services'
import Dialog, { 
  DialogFooter, 
  DialogButton, 
  DialogContent,
  ScaleAnimation,
} from '../library/react-native-popup-dialog/index'
import { ManageThemeContext } from '../theme/ThemeManager'

const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height

const outputStateInfo = ['WiFi Off', 'WiFi On']
const batteryStateInfo = ['Battery Fail', 'Battery Low', 'Battery Normal']
const poeStateInfo = ['POE Off', 'POE Adapter', 'POE Normal']
const usbStateInfo = ['USB Off', 'USB Adapter', 'USB Normal']
const pvStateInfo = ['PV Off', 'PV Adapter', 'PV Normal']
const thermalStateInfo = ['Thermal Good', 'Thermal Fail Hot', 'Thermal Fail Cold']
const pvModeStateInfo = ['PV Charging Mode', 'Adapter Charging Mode']
const directLoadInfo = ['Battery Mode', 'Direct Loading Mode']
const charToggleInfo = ['MPPT 12V', 'MPPT 18V']
const mpptChargingInfo = ['MPPT Charger Charging', 'MPPT Charger Charged', 'MPPT Charger Error', 'MPPT Charger Other']

export default class DiagnosticInfo extends PureComponent {
  constructor(props) {
    super()
    this.debugCounter = 0
    this.debugCurState = 0
    this.debugCurStateNum = 0
    this.poeVoltage = 0
    this.pvVoltage = 0
    this.usbVoltage = 0
    this.batteryVoltage = 0
    this.batteryCurrent = 0
    this.chargingCurrent = 0
    this.batteryTemperature = 0
    this.thermistor1 = 0
    this.thermistor2 = 0
    this.debugCurStateInfo = []
    this.state = {
      nrfTime: 0, 
      overlayIsVisible: false,
    }
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('focus', async () => {
      BLEService.retrieveServices(this.props.device.id)
        .then(result => {
          console.log("[DiagnosticInfo.js] - Retrieved Services:", result)
          BLEService.startDebugMode(this.props.device)
        })
        .catch((err => {
          console.log("[DiagnosticInfo.js] - Could not retrieve Services: ", err)
        }))

      this.bleServiceUpdateListener = BLEService.bleManagerEmitter.addListener(
          'BleManagerDidUpdateValueForCharacteristic',
          this.onServiceUpdate.bind(this))
      this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
            'BleManagerDisconnectPeripheral',
            this.onDeviceDisconnect.bind(this))
    })
    this.blurListener = this.props.navigation.addListener('blur', () => {
      if (this.bleServiceUpdateListener) this.bleServiceUpdateListener.remove()
      if (this.bleDisconnectListener) this.bleDisconnectListener.remove()
    })
  }

  componentWillUnmount() {
    console.log('[DiagnosticInfo.js] - componentWillUnmount')
    this.focusListener()
    this.blurListener()
    if(this.props.device) BLEService.stopDebugMode(this.props.device)
    if (this.bleServiceUpdateListener) this.bleServiceUpdateListener.remove()
    if (this.bleDisconnectListener) this.bleDisconnectListener.remove()
  }

  toDDHHMMSS = (secs) => {
    var sec_num = parseInt(secs, 10)
    var days = Math.floor(sec_num / 86400)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [days, hours, minutes, seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
  }

  onServiceUpdate = ({ value, peripheral, characteristic, service }) => {
    console.log("[DiagnosticInfo.js] - onServiceUpdate", value)
    if(characteristic === "6e400003-b5a3-f393-e0a9-e50e24dcca9e" || 
       characteristic === "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" ) {
      console.log("[DiagnosticInfo.js] - BLE_UART_READ_UUID Update")
      if(value[0] === 201) {
        this.debugCounter = (value[1] << 24) + (value[2] << 16) + (value[3] << 8) + value[4]
        this.debugCurStateNum = ((value[5] << 8) + (value[6]))
        this.debugCurState = ('0000' + ((value[5] << 8) + (value[6])).toString(16)).slice(-4)
        this.debugCurStateInfo[0] = outputStateInfo[(this.debugCurStateNum & 0x0001)]
        this.debugCurStateInfo[1] = batteryStateInfo[((this.debugCurStateNum & 0x0006) >> 1)]
        this.debugCurStateInfo[2] = poeStateInfo[((this.debugCurStateNum & 0x0018) >> 3)]
        this.debugCurStateInfo[3] = usbStateInfo[((this.debugCurStateNum & 0x0060) >> 5)]
        this.debugCurStateInfo[4] = pvStateInfo[((this.debugCurStateNum & 0x0180) >> 7)]
        this.debugCurStateInfo[5] = thermalStateInfo[((this.debugCurStateNum & 0x0600) >> 9)]
        this.debugCurStateInfo[6] = pvModeStateInfo[((this.debugCurStateNum & 0x0800) >> 11)]
        this.debugCurStateInfo[7] = directLoadInfo[((this.debugCurStateNum & 0x1000) >> 12)]
        this.debugCurStateInfo[8] = charToggleInfo[((this.debugCurStateNum & 0x2000) >> 13)]
        this.debugCurStateInfo[9] = mpptChargingInfo[((this.debugCurStateNum & 0xC000) >> 14)]
        this.poeVoltage = (value[7] << 8) + value[8]
        this.pvVoltage = (value[9] << 8) + value[10]
        this.usbVoltage = (value[11] << 8) + value[12]
        this.batteryVoltage = (value[13] << 8) + value[14]
        if((value[15] >> 7) === 0) {
          this.battteryCurrent = ((value[15] << 8) + value[16])
        }
        else {
          this.battteryCurrent = ((value[15] << 8) + value[16]) - 65536
        }
        this.chargingCurrent = (value[17] << 8) + (value[18])
      }
      else if(value[0] === 202) {
        if((value[1] >> 7) === 0) {
          this.batteryTemperature = ((value[1] << 8) + value[2]) / 10
        }
        else {
          this.batteryTemperature = (((value[1] << 8) + value[2]) - 65536) / 10
        }
        if((value[3] >> 7) === 0) {
          this.thermistor1 = ((value[3] << 8) + value[4]) / 10
        }
        else {
          this.thermistor1 = (((value[3] << 8) + value[4]) - 65536) / 10
        }
        if((value[5] >> 7) === 0) {
          this.thermistor2 = ((value[5] << 8) + value[6]) / 10
        }
        else {
          this.thermistor2 = (((value[5] << 8) + value[6]) - 65536) / 10
        }
        this.debugCounter = this.toDDHHMMSS(this.debugCounter)
        this.setState({ nrfTime: this.debugCounter })
        console.log("[DiagnosticInfo.js] - debugCurStateInfo", this.debugCurStateInfo)
      }
    }
    if(characteristic === "00002a19-0000-1000-8000-00805f9b34fb" || 
       characteristic === "00002A19-0000-1000-8000-00805F9B34FB" ||
       characteristic === "2a19" ||
       characteristic === "2A19" ) {
      let batteryValue = `${value}%`
      console.log("[DiagnosticInfo.js] - BLE_BATTERY_UPATE_UUID Update", batteryValue)
      this.props.bleBatteryUpdate(batteryValue)
    }
  }

  onDeviceDisconnect() {
    console.log('[DiagnosticInfo.js] - Device Disconnected. ')
    AlertHelper.alert('error', 'Device Disconnected', 'Device is disconnected from BLE')
    this.props.bleDeviceDisconnected()
    this.props.navigation.navigate('BLESearch', {
      fromBLE: true,
    })
  }

  openOverlay = () => {
    this.setState({ overlayIsVisible: true })
  }

  closeOverlay = () => {
    console.log("[DiagnosticInfo.js] - Close Overlay")
    this.setState({ overlayIsVisible: false })
  }

  renderPopup = () => {
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.state.overlayIsVisible}
            width={0.7}
            height={0.4}
            dialogAnimation={new ScaleAnimation()}
            footer={
              <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                <DialogButton
                  text="CLOSE"
                  textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                  onPress={() => this.closeOverlay()} />
              </DialogFooter>
            }
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                {this.debugCurStateInfo[0]} {'\n'}
                {this.debugCurStateInfo[1]} {'\n'}
                {this.debugCurStateInfo[2]} {'\n'}
                {this.debugCurStateInfo[3]} {'\n'}
                {this.debugCurStateInfo[4]} {'\n'}
                {this.debugCurStateInfo[5]} {'\n'}
                {this.debugCurStateInfo[6]} {'\n'}
                {this.debugCurStateInfo[7]} {'\n'}
                {this.debugCurStateInfo[8]} {'\n'}
                {this.debugCurStateInfo[9]}
              </Text>
            </DialogContent>
          </Dialog>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  render() {
    const { navigation } = this.props
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
           <DefaultHeaderHOC
            title={'Diagnostic Info'}
            navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <ScrollView>
                <SelectBox
                  title="NRF Time"
                  subTitle='Day:Hour:Minute:Second'
                  rightText={this.debugCounter}
                />
                <SelectBox
                  title="Current State"
                  subTitle='Press for detailed information'
                  rightText={'0x' + this.debugCurState}
                  onPress={() => this.openOverlay()}
                />
                <SelectBox
                  title="POE Voltage"
                  rightText={this.poeVoltage + 'mV'}
                />
                <SelectBox
                  title="PV Voltage"
                  rightText={this.pvVoltage + 'mV'}
                />
                <SelectBox
                  title="USB Voltage"
                  rightText={this.usbVoltage + 'mV'}
                />
                <SelectBox
                  title="Charger Current"
                  rightText={this.chargingCurrent + 'mA'}
                />
                <SelectBox
                  title="Battery Voltage"
                  rightText={this.batteryVoltage + 'mV'}
                />
                <SelectBox
                  title="Battery Current"
                  rightText={this.battteryCurrent + 'mA'}
                />
                
                <SelectBox
                  title="Battery Temperature"
                  rightText={this.batteryTemperature + 'C'}
                />
                <SelectBox
                  title="Thermistor 1 Temperature"
                  rightText={this.thermistor1 + 'C'}
                />
                <SelectBox
                  title="Thermistor 2 Temperature"
                  rightText={this.thermistor2 + 'C'}
                />
              </ScrollView>
              {this.renderPopup()}
            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  popupDialogStyle: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.34,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },

  popupTextStyle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#191919'
  },

  popupButtonStyle: {
    width: screenWidth * 0.7, 
    height: screenHeight * 0.06, 
    alignSelf: 'auto'
  },

  cancelButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#191919',
  },

  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

})

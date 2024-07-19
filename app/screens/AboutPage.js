import React, { PureComponent } from 'react'
import { ActivityIndicator, StyleSheet, View, ScrollView, Text, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { Field, Button, DefaultHeaderHOC, SelectBox, Switch } from '../components'
import { BLEService, AlertHelper, FirmwareUpdateService } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'
import { Logo, ChevronRight, ChevronDown } from '../components/svg'
import { FirmwareUpdateOverlay } from '../containers'
import Modal from 'react-native-modal'
import Dialog, { 
  DialogFooter, 
  DialogButton, 
  DialogContent,
  ScaleAnimation,
} from '../library/react-native-popup-dialog/index'

const STOP_SEARCH_TIMEOUT_MS = 5 * 1000
const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height

const batterySettingInfoArray = ['3 Packs', '4 Packs', '5 Packs', 'Test Pack 1', 'Test Pack 2', 'Test Pack 3', 'No Battery']
const batterySettingInfoArrayV04 = ['No Battery', 'Battery Attached']
const bootModeSettingInfoArray = ['SPI-NOR', 'eMMC', 'NAND', 'USB']
const pvModeSettingInfoArray = ['18V', '12V']

const bootmodeSettingDataArray = [[48, 48], [48, 49], [49, 48], [49, 49]]
const batterySettingDataArrayV04 = [48, 49]
export default class AboutPage extends PureComponent {
  constructor(props) {
    super()
    this.dfuScanTimeout = null
    this.searchTimeout = null
    this.connectTimeout = null
    this.otaCommandTimeout = null

    this.dfuStateListenerSet = false
    this.bleDisconnectListenerSet = false
    this.discoverDeviceHandlerListenerSet = false

    const { params } = props.route
    this.read_fw_version_counter = 0
    this.read_hw_version_counter = 0
    this.prevBatteryOptionLoc = 0
    this.prevBootModeOptionLoc = 0
    this.prevPVModeOptionLoc = 0
    this.repeatCount = 0

    this.state = {
      device: params.device,
      isSearching: false,
      connecting: false,
      name: '',
      mac: params.mac,
      prev_mac: props.device.advertising.localName.slice(16, 24),
      prev_id: props.device.id,
      default_mac_mode: false,
      bad_mac_mode: false,
      file: '',
      filePath: 'path',
      hardwareVersion: (0.4).toFixed(1),
      firmwareVersion: (1.0).toFixed(1),
      isThereUpdate: false,
      updatefirmwareVersion: (1.0).toFixed(1),
      updateSoftwareName: 'something',
      overlayIsVisible: false,
      bledeviceDiscovered: false,

      isModalVisible: false,
      batteryOptionLoc: 0,
      bootModeOptionLoc: 0,
      pvModeOptionLoc: 0,
      modalType: 'battery',
      settingOverlayIsVisible: false,
      batteryOtaOption: 'na',
    }
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('focus', async () => {
      BLEService.retrieveServices(this.props.device.id)
        .then(result => {
          console.log("[AboutPage.js] - Retrieved Services:", result)
          BLEService.checkFirmwareVersion(this.props.device)
        })
        .catch((err => {
          console.log("[AboutPage.js] - Could not retrieve Services: ", err)
        }))

      this.bleServiceUpdateListener = BLEService.bleManagerEmitter.addListener(
          'BleManagerDidUpdateValueForCharacteristic',
          this.onServiceUpdate.bind(this))

      this.stopScanHandlerListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerStopScan', 
        this.stopScanHandler.bind(this))

      this.props.dfuSubscribe()
      this.props.dfuPercent(0)

      this.dfuProgressListener = FirmwareUpdateService.DFUEmitter.addListener('DFUProgress', ({percent, currentPart, partsTotal, avgSpeed, speed}) => {
        this.props.dfuPercent(percent)
      })

      this.dfuStateListener = FirmwareUpdateService.DFUEmitter.addListener('DFUStateChanged', ({state, error}) => {
        console.log('[AboutPage.js] - DFU State:', state)
          if (state === 'DFU_PROCESS_STARTING') {
            this.props.dfuUpdating(this.state.name, this.state.file)
          }
          if (state === 'DFU_COMPLETED') {
            this.dfuStateListener.remove()
            this.dfuStateListenerSet = false
            this.props.dfuApplyUpdate()
            this.repeatCount = 0
            this.repeatScan()
          }
          if (state === '[FirmwareUpdate.js] - DFU_FAILED') {
            console.log("DFU FAILED: ", error)
            this.props.dfuError()
          }
      })

      this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        this.onDeviceDisconnect.bind(this),
      )

      this.discoverDeviceHandlerListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral', 
        this.discoverDeviceHandler.bind(this))

      this.discoverDeviceHandlerListenerSet = true
      this.bleDisconnectListenerSet = true

      this.dfuStateListenerSet = true

    })

    this.blurListener = this.props.navigation.addListener('blur', () => {
      console.log('[AboutPage.js] - willBlur')
      if(this.searchTimeout) clearTimeout(this.searchTimeout)
      if(this.connectTimeout) clearTimeout(this.connectTimeout)
      if(this.dfuScanTimeout) clearTimeout(this.dfuScanTimeout)
      
      this.stopScanHandlerListener.remove()
      this.bleServiceUpdateListener.remove()
      if(this.discoverDeviceHandlerListenerSet) this.discoverDeviceHandlerListener.remove()
      if(this.bleDisconnectListenerSet) this.bleDisconnectListener.remove()

      this.dfuProgressListener.remove()
      if(this.dfuStateListenerSet) this.dfuStateListener.remove()

      this.props.dfuUnsubscribe()
      this.closeOverlay()
    })

  }

  componentWillUnmount() {
    
    console.log('[AboutPage.js] - componentWillUnmount', this.dfuStateListener, this.dfuProgressListener)
    if(this.searchTimeout) clearTimeout(this.searchTimeout)
    if(this.connectTimeout) clearTimeout(this.connectTimeout)
    if(this.dfuScanTimeout) clearTimeout(this.dfuScanTimeout)
    this.focusListener()
    this.blurListener()

    this.stopScanHandlerListener.remove()
    this.bleServiceUpdateListener.remove()
    if(this.discoverDeviceHandlerListenerSet) this.discoverDeviceHandlerListener.remove()
    if(this.bleDisconnectListenerSet) this.bleDisconnectListener.remove()

    this.dfuProgressListener.remove()
    if(this.dfuStateListenerSet) this.dfuStateListener.remove()

    this.props.dfuUnsubscribe()
    this.closeOverlay()
  }

  onDeviceDisconnect() {
    console.log("[AboutPage.js] - onDeviceDisconnect", this.props.dfuBleMask)
    if(this.state.default_mac_mode === true) {
      this.setState({default_mac_mode: false})
      this.bleScan(this, false)
    }
    else if(this.props.dfuBleMask === false)
    {
      console.log("[AboutPage.js] - onDeviceDisconnect outside OTA")
      AlertHelper.alert('error', 'Device Disconnected', 'Device is disconnected from BLE')
      this.props.bleDeviceDisconnected()
      this.props.navigation.navigate('BLESearch', {
      fromBLE: true,
    })
    }
  }

  onServiceUpdate = ({ value, peripheral, characteristic, service }) => {
    console.log("[AboutPage.js] - onServiceUpdate")
    if(characteristic === "6e400003-b5a3-f393-e0a9-e50e24dcca9e" || 
       characteristic === "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" ) {
      console.log("[AboutPage.js] - BLE_UART_READ_UUID Update", value)
      if(value[0] === 86) {
        this.read_fw_version_counter ++
        if((value.length === 2) && (this.read_fw_version_counter === 1)) {
          let fmVersion = (parseFloat(((value[1] >> 4) + '.' + (value[1] & 0x0F)))).toFixed(1)
          console.log('[AboutPage.js] - FirmwareVersion: ', fmVersion)
          if(this.state.default_mac_mode === true) {
            BLEService.changeAddress(this.props.device, this.state.prev_mac)
            this.setState({ firmwareVersion: fmVersion })
          }
          else {
            this.setState({ firmwareVersion: fmVersion })
          }
          this.read_fw_version_counter = 0
        }
        else if((value.length === 1) && (this.read_fw_version_counter === 1)) {
          this.setState({ firmwareVersion: 1.0.toFixed(1)})
          this.read_fw_version_counter = 0
        }
        else if(this.read_fw_version_counter === 2) {
          this.read_fw_version_counter = 0
        }
        BLEService.checkHardwareVersion(this.props.device)
      }
      else if(value[0] === 72) {
        this.read_hw_version_counter ++
        if((value.length === 2) && (this.read_hw_version_counter === 1)) {
          let hwVersion = (parseFloat(((value[1] >> 4) + '.' + (value[1] & 0x0F)))).toFixed(1)
          console.log('[AboutPage.js] - HardwareVersion: ', hwVersion)
          this.setState({ hardwareVersion: hwVersion })
          this.read_hw_version_counter = 0
          BLEService.readConfig(this.props.device)
        }
        else if((value.length === 1) && (this.read_hw_version_counter === 1)) {
          this.setState({ hardwareVersion: 0.4.toFixed(1) })
          this.read_hw_version_counter = 0
        }
        else if(this.read_hw_version_counter === 2) {
          this.read_hw_version_counter = 0
        }
      }
      else if(value[0] === 195) {
        console.log("[AboutPage.js] - Config Values", value)
        let bootModeOptionLoc = 0
        if((value[1] === 48) && (value[2] === 48)) {
          bootModeOptionLoc = 0
        }
        else if((value[1] === 48) && (value[2] === 49)) {
          bootModeOptionLoc = 1
        }
        else if((value[1] === 49) && (value[2] === 48)) {
          bootModeOptionLoc = 2
        }
        else if((value[1] === 49) && (value[2] === 49)) {
          bootModeOptionLoc = 3
        }
        else {
          bootModeOptionLoc = 0
        }
        if(this.state.hardwareVersion === (0.4).toFixed(1)) {
          this.setState({ 
            bootModeOptionLoc: bootModeOptionLoc,
            batteryOptionLoc: value[3] - 48,
            pvModeOptionLoc: 0
          })
        }
        else {
          this.setState({ 
            bootModeOptionLoc: bootModeOptionLoc,
            batteryOptionLoc: value[3],
            pvModeOptionLoc: value[4] 
          })
        }
      }
    }
    if(characteristic === "00002a19-0000-1000-8000-00805f9b34fb" || 
       characteristic === "00002A19-0000-1000-8000-00805F9B34FB" ||
       characteristic === "2a19" ||
       characteristic === "2A19" ) {
      let batteryValue = `${value}%`
      console.log("[AboutPage.js] - BLE_BATTERY_UPATE_UUID Update", batteryValue)
      this.props.bleBatteryUpdate(batteryValue)
    }
  }

  discoverDeviceHandler(device) {
    let localName = device.advertising.localName
    if ((localName === "DfuTarg") && (this.state.bledeviceDiscovered === false)) {
      this.setState({ bledeviceDiscovered: true })
      let path = ""
      if (Platform.OS === 'android') {
        path = this.state.file
      }
      else {
        path = "file:///" + this.state.file
      }
      this.repeatCount = 100
      console.log("[AboutPage.js] - path: ", path)
      this.stopSearch()
        .then(() => {
          console.log("[AboutPage.js] - WTF1")
          this.setState({name: device.name})
          this.props.dfuInit()
          FirmwareUpdateService.startDFU(device, path)
            .then((res) => {
              console.log("[AboutPage.js] - Transfer done: ", res.deviceAddress)
            })
            .catch((e) => {
              console.log("[AboutPage.js] - Transfer Error: ", e)
            })
        })
    }
    
    else if (localName && localName.includes('MeshPP') && (device.id === this.state.prev_id) && (this.state.bledeviceDiscovered === false)) {
      console.log("[AboutPage.js] - WTF2")
      this.setState({ bledeviceDiscovered: true, bad_mac_mode: false })
      this.repeatCount = 100
      this.stopSearch()
        .then(() => {
          const macMatch = localName.match(/([0-9A-F]{2}:?){6}/g)
          const mac = macMatch && macMatch.length ? macMatch[0] : ''
          if (mac && mac.toUpperCase() === this.state.mac.toUpperCase()) {
            console.log("[AboutPage.js] - MAC set correctly!")
            this.connectToDevice(device)
              .catch(() => {
                console.log("[AboutPage.js] - Error Connecting, retry 1")
                this.connectToDevice(device)
                  .catch(() => {
                    console.log("[AboutPage.js] - Error Connecting, retry 2")
                    this.connectToDevice(device)
                      .catch(() => {
                        this.props.dfuError()
                        AlertHelper.alert('error', 'Error', 'DFU failed, please contact MeshPlusPlus office')
                      })
                  })    
              })
          }
          // If the MAC address setting results in error. 
          else if (localName === "MeshPP_SW_Error__BAD_MAC")
          {
            console.log("[AboutPage.js] - MeshPP_SW_Error__BAD_MAC")
            this.repeatCount = 0
            this.setState({ bad_mac_mode: true })
            this.connectToDevice(device)
              .catch(() => {
                console.log("[AboutPage.js] - Error Connecting, retry 1")
                this.connectToDevice(device)
                  .catch(() => {
                    console.log("[AboutPage.js] - Error Connecting, retry 2")
                    this.connectToDevice(device)
                      .catch(() => {
                        this.props.dfuError()
                        AlertHelper.alert('error', 'Error', 'DFU failed, please contact MeshPlusPlus office')
                      })
                  })    
              })
              
          }
          else if ((localName.includes("MeshPP_20:CE:2A:00")) || (localName === "MeshPP_20:CE:2A:ZZZZZZZZ"))   {
            console.log("[AboutPage.js] - Default MAC Address, time to set it!")
            this.read_fw_version_counter = 0
            this.setState({ default_mac_mode: true })
            this.connectToDevice(device)
              .catch(() => {
                this.connectToDevice(device)
                  .catch(() => {
                    this.connectToDevice(device)
                      .catch(() => {
                        this.props.dfuError()
                        AlertHelper.alert('error', 'Error', 'DFU failed, please contact MeshPlusPlus office')
                      })
                  })   
              })
          }
        })
    }
  }

  stopScanHandler() {
    console.log("[AboutPage.js] - stopScanHandler")
    //this.props.bleSearchStop()
  }

  subscribeBLEServices() {
    console.log("[AboutPage.js] - subscribeBLEServices")
    return new Promise((resolve, reject) => {
      BLEService.retrieveServices(this.props.device.id)
        .then((result) => {
          this.props.bleCharacteristicsDiscovered(result)
          console.log("[AboutPage.js] - Characteristics: ", result.characteristics)

          let characteristics = result.characteristics
          let index = characteristics.findIndex(characteristic => 
            (characteristic.characteristic === "6e400003-b5a3-f393-e0a9-e50e24dcca9e") ||
            (characteristic.characteristic === "6E400003-B5A3-F393-E0A9-E50E24DCCA9E") )
          let char = characteristics[index]
          BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
            .then((result) => {
              console.log("[AboutPage.js] - Subscribed to BLE UART Characteristic")
              index = characteristics.findIndex(characteristic => 
                (characteristic.characteristic === "2a19") || 
                (characteristic.characteristic === "2A19") || 
                (characteristic.characteristic === "00002a19-0000-1000-8000-00805f9b34fb") ||
                (characteristic.characteristic === "00002A19-0000-1000-8000-00805F9B34FB") )
              char = characteristics[index]
              BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
                .then((result) => {
                  console.log("[AboutPage.js] - Subscribed to BLE Battery Characteristic")
                  this.props.bleServiceSubscribed(characteristics)
                  resolve()
                })
                .catch((error) => {
                  console.log("[AboutPage.js] - Cannot Subscribe to BLE Battery Characteristic: ", error)
                })
            })
            .catch((error) => {
              console.log("[AboutPage.js] - Cannot Subscribe to BLE UART Characteristic: ", error)
            })        
        })
        .catch((error) => {
          console.log("[AboutPage.js] - Could not retrieve Services: ", error)
        })
    })
  }

  unsubscribeBLEServices() {
    console.log("[AboutPage.js] - unsubscribeBLEServices")

    let characteristics = this.props.characteristics
    let index = characteristics.findIndex(characteristic => 
      (characteristic.characteristic === "6e400003-b5a3-f393-e0a9-e50e24dcca9e") ||
      (characteristic.characteristic === "6E400003-B5A3-F393-E0A9-E50E24DCCA9E") )
    let char = characteristics[index]
    console.log("[AboutPage.js] - Characteristics: ", char)
    return new Promise((resolve, reject) => {
      BLEService.stopNotification(this.props.device.id, char.service, char.characteristic)
        .then((result) => {
          console.log("[AboutPage.js] - Unsubscribed to BLE UART Characteristic")
          index = characteristics.findIndex(characteristic => 
            (characteristic.characteristic === "2a19") || 
            (characteristic.characteristic === "2A19") || 
            (characteristic.characteristic === "00002a19-0000-1000-8000-00805f9b34fb") ||
            (characteristic.characteristic === "00002A19-0000-1000-8000-00805F9B34FB") )
          char = characteristics[index]
          BLEService.stopNotification(this.props.device.id, char.service, char.characteristic)
            .then((result) => {
              this.props.bleServiceUnsubscribed()
              resolve()
              console.log("[AboutPage.js] - Unsubscribed to BLE Battery Characteristic")
            })
            .catch((error) => {
              console.log("[AboutPage.js] - Cannot Unsubscribe to BLE Battery Characteristic: ", error)
            })
        })
        .catch((error) => {
          console.log("[AboutPage.js] - Cannot Unsubscribe to BLE UART Characteristic: ", error)
        })
    })
  }

  onPressCheckUpdates() {
    this.props.checkFirmware()
    this.setState({ overlayIsVisible: true })
    // Once we acquired all the names of the files, get the version of the
    FirmwareUpdateService.getAllFileNames()
    .then((ret) => {
      console.log('[AboutPage.js] - getAllFileNames: ', ret)
      let maxFirmwareVersion = this.state.firmwareVersion
      ret['Contents'].forEach(obj => {
        let firmwareName = obj['Key'].toString()
        console.log('[AboutPage.js] - firmwareName: ', firmwareName)
        var hwvPos = firmwareName.indexOf('v')
        var fwvPos = firmwareName.lastIndexOf('v')
        let hardwareVersion = (parseFloat(firmwareName.slice(hwvPos + 1, fwvPos - 1).replace('_', '.'))).toFixed(1)
        let firmwareVersion = (parseFloat(firmwareName.slice(fwvPos + 1, firmwareName.indexOf('.')).replace('_', '.'))).toFixed(1)
        console.log('[AboutPage.js] - hardwareVersion: ', hardwareVersion)
        console.log('[AboutPage.js] - firmwareVersion: ', firmwareVersion)
        if((this.state.hardwareVersion === hardwareVersion) && (firmwareVersion > maxFirmwareVersion)) {
          maxFirmwareVersion = firmwareVersion
          this.setState({ updateSoftwareName: firmwareName})
        }
      })
      
      if(maxFirmwareVersion > this.state.firmwareVersion) {
        this.setState({ updatefirmwareVersion: maxFirmwareVersion, 
                        isThereUpdate: true })
        console.log("[AboutPage.js] - Max Version is: ", this.state.updatefirmwareVersion, this.state.updateSoftwareName)

        FirmwareUpdateService.getFileURL(this.state.updateSoftwareName)
          .then((res) => {
            this.state.filePath = res
            this.props.checkFirmwareSuccess(this.state.updateSoftwareName)
            console.log("[AboutPage.js] - URL read success: ", res)
          })
          .catch((e) => {
            this.props.checkFirmwareFail(this.state.updateSoftwareName)
            console.log("[AboutPage.js] - URL read error: ", e)
          })
      } else {
        console.log("[AboutPage.js] - No update!")
        this.props.checkFirmwareFinished()
        this.props.dfuUpdated(this.props.device, this.state.file)
        this.setState({isThereUpdate: false})
      }
    })
  }

  onPressReloadMac() {
    console.log('[AboutPage.js] - onPressReloadMac')
    this.setState({ modalType: 'mac', 
                    settingOverlayIsVisible: true })
  }

  disconnect() {
    console.log("[AboutPage.js] - Disconnecting Device", this.props.characteristics)
    BLEService.disconnectDevice(this.props.device.id)
      .then((results) => {
        this.props.bleDeviceDisconnected(this.props.device.peripheral)
      })
      .catch((e) => {
        console.log("[AboutPage.js] - Device Disconnect Error " + e)
      })
  }

  closeOverlay = () => {
    console.log("[AboutPage.js] - closeOverlay")
    this.setState({ overlayIsVisible: false })
  }

  startUpdate = (device, firmware) => {
    this.props.downloadFirmware(this.state.filePath)
    FirmwareUpdateService.downloadFirmware(this.state.filePath)
      .then((res) => {
        console.log("[AboutPage.js] - Firmware saved to: ", res.path())
        this.setState({file: res.path()})
        this.props.downloadFirmwareSuccess(res.path())
        this.bleDisconnectListener.remove()
        this.bleDisconnectListenerSet = false
        console.log("[AboutPage.js] - dfuBleMask: ", this.props.dfuBleMask)
        this.otaCommandTimeout = setTimeout(() => {
          this.connectDFU(device, res.path())
        }, 100)
        
      })
      .catch((e) => {
        console.log("[AboutPage.js] - Firmware Download Fail: ", e)
        this.props.downloadFirmwareFail(this.state.filePath)
      })
  }

  checkBattery = (device, firmware) => {
    if (this.state.hardwareVersion === (0.4).toFixed(1)) {
      this.props.selectBattery0v4()
    }
    else {
      this.startUpdate(device, firmware)
    }
  }

  selectBatteryNormal = (device, firmware) => {
    console.log("[AboutPage.js] - selectBatteryNormal")
    this.setState({ batteryOtaOption: 'bat' })
    this.startUpdate(device, firmware)
  }

  selectBatteryAdapter = (device, firmware) => {
    console.log("[AboutPage.js] - selectBatteryAdapter")
    this.setState({ batteryOtaOption: '12v' })
    this.startUpdate(device, firmware)
  }

  connectDFU = async (device, file) => {
    this.setState({name: device.name, file: file})
    console.log("[AboutPage.js] - connectDFU")
    BLEService.startOTA(this.props.device)
    this.searchTimeout = setTimeout(() => {
      this.repeatCount = 28
      this.bleScan.call(this, true)
    }, 1000)

  }

  repeatScan = () => {
    this.repeatCount ++
    this.bleScan.call(this, true)
  }

  bleScan(isRepeat = false) {
    if(this.searchTimeout) clearTimeout(this.searchTimeout)
    
    BLEService.startScan()
      .then(() => {
        console.log('[AboutPage.js] - Start Scan Success')
        this.setState({ bledeviceDiscovered: false })
        this.props.bleSearchStart()
        this.searchTimeout = setTimeout(() => {
          console.log("[AboutPage.js] - Scanning Timeout", this.repeatCount)
          this.stopSearch()
          if((this.repeatCount < 30) && (isRepeat === true)) {
            console.log("[AboutPage.js] - repeatCount", this.repeatCount)
            this.repeatScan()
          }
        }, STOP_SEARCH_TIMEOUT_MS)
      })
      .catch((error) => {
        console.log('[AboutPage.js] - Start Scan Error: ', error)
        this.props.bleSearchError(error)
        this.stopSearch()
      })
  }

  connectToDevice = (device) => {
    console.log("[AboutPage.js] - Connecting Device")
    return new Promise((resolve, reject) => {
      //this.props.bleDeviceConnecting(device.id)
      BLEService.connectDevice(device.id)
        .then(() => {
          // Success code
          console.log("[AboutPage.js] - Device Connected")
          console.log("[AboutPage.js] - Name: " + device.localName + " ID: " + device.id)
          this.props.bleDeviceConnected(device)
          this.subscribeBLEServices()
            .then(() => {
              clearTimeout(this.connectTimeout)
              this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
                'BleManagerDisconnectPeripheral', 
                this.onDeviceDisconnect.bind(this))
              this.bleDisconnectListenerSet = true
              console.log("[AboutPage.js] - Subscribed to BLE Services", this.state.default_mac_mode, this.state.bad_mac_mode, this.state.batteryOtaOption)
              if ((this.state.default_mac_mode === false) && (this.state.bad_mac_mode === false)) {
                this.props.dfuUpdated(this.state.name, this.state.file)
                BLEService.checkFirmwareVersion(this.props.device)
              }
              else if (this.state.bad_mac_mode === true) {
                console.log("[AboutPage.js] - Recover Device")
                this.recover_device()
              }
              resolve()
            })

        })
        .catch((e) => {
          // Failure code
          console.log("[AboutPage.js] - Connecting Device error: " + e)
          clearTimeout(this.connectTimeout)
          reject()
        })
      this.connectTimeout = setTimeout(() => {
        console.log("[AboutPage.js] - Connecting Timeout")
        reject()
      }, STOP_SEARCH_TIMEOUT_MS)
    })
  }

  stopSearch = () => {
    return new Promise((resolve, reject) => {
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      BLEService.stopScan()
        .then(() => { 
          this.props.bleSearchStop()
          resolve()
        })
    })
  }

  enableDormantMode = () => {
    if (this.props.device) {
      BLEService.enableDormantMode(this.props.device)
      this.props.bleDormantEnabled(true)
    } else AlertHelper.alert('warning', 'Warning', 'Device connection has been lost')
  }

  resetSystem = () => {
    if (this.props.device) {
      BLEService.resetNRF(this.props.device)
      this.props.bleSystemReset(true)
    } else AlertHelper.alert('warning', 'Warning', 'Device connection has been lost')
  }

  recover_device = () => {
    if (this.props.device) {
      if(this.bleDisconnectListenerSet) this.bleDisconnectListener.remove()
      this.bleDisconnectListenerSet = false
      if(this.state.batteryOtaOption === '12v') {
        console.log("[AboutPage.js] - Setting Battery Absent")
        BLEService.setBatteryPack(this.props.device, batterySettingDataArrayV04[0]);
        setTimeout(() => {
          console.log("[AboutPage.js] - Turning on Device")
          BLEService.turnOnDevice(this.props.device)
        }, 200)
        setTimeout(() => {
          console.log("[AboutPage.js] - Change MAC address")
          BLEService.changeAddress(this.props.device, this.state.prev_mac)
        }, 500)

        setTimeout(() => {
          this.repeatCount = 0
          this.repeatScan()
        }, 1000)
      }
      else {
        setTimeout(() => {
          console.log("[AboutPage.js] - Change MAC address")
          BLEService.changeAddress(this.props.device, this.state.prev_mac)
        }, 200)

        setTimeout(() => {
          this.repeatCount = 0
          this.repeatScan()
        }, 500)
      }
    }
  }

  onDiagnosticInfo = async () => {
    this.props.navigation.navigate('DiagnosticInfo', {
      fromBLE: true,
    })
  }

  toggleModal = () => {
    this.setState((state) => ({ isModalVisible: !state.isModalVisible }))
  }

  selectModalType = (type) => {
    this.setState({ modalType: type })
    this.toggleModal()
  }

  selectOption = (loc) => {
    if (this.state.modalType === 'bootmode') {
      console.log('[AboutPage.js] - selectBootModeOption', loc)
      this.prevBootModeOptionLoc = this.state.bootModeOptionLoc
      this.setState({ bootModeOptionLoc: loc,
                      isModalVisible: false,
                      settingOverlayIsVisible: true })
    } 
    else if (this.state.modalType === 'pvmode') {
      console.log('[AboutPage.js] - selectPVModeOption', loc)
      this.prevPVModeOptionLoc = this.state.pvModeOptionLoc
      this.setState({ pvModeOptionLoc: loc,
                      isModalVisible: false,
                      settingOverlayIsVisible: true })
    }
    else {
      console.log('[AboutPage.js] - selectBatteryOption', loc)
      this.prevBatteryOptionLoc = this.state.batteryOptionLoc
      this.setState({ batteryOptionLoc: loc,
                      isModalVisible: false,
                      settingOverlayIsVisible: true })
    }
  }

  renderModal = () => {
    const { isModalVisible, modalType} = this.state

    let modalOptions
    if (modalType === 'bootmode') {
      modalOptions = bootModeSettingInfoArray
    } 
    else if (modalType === 'pvmode') {
      modalOptions = pvModeSettingInfoArray
    }
    else {
      if(this.state.hardwareVersion === (0.4).toFixed(1)){
        modalOptions = batterySettingInfoArrayV04
      }
      else {
        modalOptions = batterySettingInfoArray
      }
    }

    let modalHeight = this.state.firmwareVersion >= 2.0 ? 240 : 144
    if (modalHeight > Dimensions.get('window').height / 2) modalHeight = Dimensions.get('window').height * 0.5
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Modal
            propagateSwipe
            useNativeDriver
            hideModalContentWhileAnimating
            isVisible={isModalVisible}
            style={styles.bottomModal}
            onSwipeComplete={() => this.setState({ isModalVisible: false })}
            swipeDirection={['down']}
            onBackdropPress={this.toggleModal}>
            <View
              style={[
                { ...styles.bottomModalContainer, backgroundColor: theme.primaryBackground },
                { height: modalHeight },
              ]}>
              {this.state.firmwareVersion >= 2.0 && (
                <ScrollView>
                  {modalOptions.map((value, id) => (
                    <TouchableOpacity
                      key={id}
                      style={{ ...styles.bottomModalOption, backgroundColor: theme.primaryCardBgr }}
                      onPress={() => this.selectOption(id)}>
                      <Text style={{ ...styles.bottomOptionValue, color: theme.primaryText }}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </Modal>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  setOptionCloseOverlay = () => {
    if(this.state.modalType === 'mac') {
      BLEService.changeAddress(this.props.device, '')
    }
    else if (this.state.modalType === 'bootmode') {
      if(this.state.bootModeOptionLoc != this.prevBootModeOptionLoc) {
        BLEService.setBootMode(this.props.device, bootmodeSettingDataArray[this.state.bootModeOptionLoc])
      }
    } 
    else if (this.state.modalType === 'pvmode') {
      if(this.state.pvModeOptionLoc != this.prevPVModeOptionLoc) {
        BLEService.setPVMode(this.props.device, this.state.pvModeOptionLoc)
      }
    }
    else {
      if(this.state.batteryOptionLoc != this.prevBatteryOptionLoc) {
        if(this.state.hardwareVersion === (0.4).toFixed(1)) {
          BLEService.setBatteryPack(this.props.device, batterySettingDataArrayV04[this.state.batteryOptionLoc])
        }
        else {
          BLEService.setBatteryPack(this.props.device, this.state.batteryOptionLoc)
        }
      }
    }
    this.setState({ settingOverlayIsVisible: false })
  }

  cancelOptionCloseOverlay = () => {
    if (this.state.modalType === 'bootmode') {
      this.setState({ bootModeOptionLoc: this.prevBootModeOptionLoc,
                      settingOverlayIsVisible: false })
    } 
    else if (this.state.modalType === 'pvmode') {
      this.setState({ pvModeOptionLoc: this.prevPVModeOptionLoc,
                      settingOverlayIsVisible: false })
    }
    else {
      this.setState({ batteryOptionLoc: this.prevBatteryOptionLoc,
                      settingOverlayIsVisible: false })
    }
  }

  renderPopupText = (theme) => {
    if(this.state.modalType === 'mac') {
      return (
        <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
          Reloading MAC Address will result in a system restart. Confirm MAC Address Reload?
        </Text>
      )
    }
    else if(this.state.modalType === 'bootmode') {
      return (
        <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
          Setting a new Bootmode will cause WiFi to restart. It could also potentially damage the device. {"\n"}
          Do you want to continue?
        </Text>
      )
    }
    else if(this.state.modalType === 'pvmode') {
      return (
        <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
          Setting a new PV Mode can cause the charger to not charging. {"\n"}
          Do you want to continue?
        </Text>
      )
    }
    else {
      return (  
        <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
          Setting a new Battery Option can cause the battery to recalibrate. {"\n"}
          Do you want to continue?
        </Text>
      )
    }
  }

  renderPopup = () => {
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.state.settingOverlayIsVisible}
            width={0.7}
            height={0.24}
            dialogAnimation={new ScaleAnimation()}
            footer={
              <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                <DialogButton
                  text="CANCEL"
                  textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                  onPress={() => this.cancelOptionCloseOverlay()} />
                <DialogButton
                  text="OK"
                  textStyle={styles.okButtonText}
                  onPress={() => this.setOptionCloseOverlay()} />
              </DialogFooter>
            }
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              {this.renderPopupText(theme)}
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
            title={'About'}
            navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>

              {this.renderModal()}
              {this.renderPopup()}

              <View style={styles.logoContainerStyle}>
                <Logo height={screenHeight/10}/>
              </View>

              <View style={{ ...styles.section, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                <ScrollView style={styles.scrollContainer}>
                  <SelectBox
                    title="Hardware Version"
                    rightText={'v' + this.state.hardwareVersion}
                    rightTextColor={theme.primaryText}
                  />
                  <SelectBox
                    title="Bluetooth Firmware Version"
                    rightText={'v' + this.state.firmwareVersion}
                    rightTextColor={theme.primaryText}
                  />
                  <SelectBox
                    title="Boot Mode"
                    subTitle='Setting bootmode Will restart the WiFi'
                    rightText={bootModeSettingInfoArray[this.state.bootModeOptionLoc]}
                    rightTextColor={theme.primaryText}
                    onPress={() => this.selectModalType('bootmode')}
                  />

                  {this.state.firmwareVersion >= 2.0 && (
                    <>
                    {this.state.hardwareVersion > 0.4 && (
                      <>
                      <SelectBox
                        title="PV Mode"
                        subTitle='Set MPPT voltage'
                        rightText={pvModeSettingInfoArray[this.state.pvModeOptionLoc]}
                        rightTextColor={theme.primaryText}
                        onPress={() => this.selectModalType('pvmode')}
                      />
                      </>
                    )}
                    <SelectBox
                      title="Battery Capacity"
                      subTitle='Select Battery Capacity'
                      rightText={(this.state.hardwareVersion === (0.5).toFixed(1)) ? batterySettingInfoArray[this.state.batteryOptionLoc] : batterySettingInfoArrayV04[this.state.batteryOptionLoc]}
                      rightTextColor={theme.primaryText}
                      onPress={() => this.selectModalType('battery')}
                    />
                    <SelectBox
                      title="Reload MAC Address "
                      subTitle='Reload MAC Address from Radio'
                      onPress={this.onPressReloadMac.bind(this)}
                    />
                    <SelectBox
                      title="Diagnostic Log"
                      subTitle='Read Chipset debug information'
                      rightText={<ChevronDown size={16} fill={"#a3acba"}/>}
                      rightTextColor={theme.primaryText}
                      onPress={this.onDiagnosticInfo}
                    />
                    </>
                  )}

                  <SelectBox
                    title="Bluetooth Firmware Update"
                    subTitle='Check Bluetooth chipset firmware update'
                    onPress={this.onPressCheckUpdates.bind(this)}
                  />

                  <View style={styles.buttonRowWrap}>
                    <View style={styles.labelWrap}>
                      <Text style={{...styles.label, color: theme.primaryText}}>
                        Dormant Mode
                      </Text>
                      <Text numberOfLines={2} style={styles.subTitle}>
                        Turn off the node until it is plugged into a power adapter
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={this.props.isDormantEnabled}
                      style={[
                        styles.dormantButton,
                        this.props.isDormantEnabled ? { backgroundColor: '#E6ECF5' } : null,
                      ]}
                      onPress={this.enableDormantMode.bind(this)}>
                      <Text style={styles.activateText}>
                        {!this.props.isDormantEnabled ? 'ACTIVATE' : 'ACTIVATED'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {this.state.firmwareVersion >= 2.0 && (
                    <>
                    <View style={styles.buttonRowWrap}>
                      <View style={styles.labelWrap}>
                        <Text style={{...styles.label, color: theme.primaryText}}>
                          System Reset
                        </Text>
                        <Text numberOfLines={2} style={styles.subTitle}>
                          Reset the Entire System
                        </Text>
                      </View>
                      <TouchableOpacity
                        disabled={this.props.isResetEnabled}
                        style={[
                          styles.dormantButton,
                          this.props.isResetEnabled ? { backgroundColor: '#E6ECF5' } : null,
                        ]}
                        onPress={this.resetSystem.bind(this)}>
                        <Text style={styles.activateText}>
                          {!this.props.isResetEnabled ? 'ACTIVATE' : 'ACTIVATED'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    </>
                  )}
                </ScrollView>
              </View>

              <FirmwareUpdateOverlay
                overlayIsVisible={this.state.overlayIsVisible}
                closeOverlay={this.closeOverlay.bind(this)}
                checkBattery={() => this.checkBattery(this.props.device, this.props.firmware)}
                selectBatteryNormal={() => this.selectBatteryNormal(this.props.device, this.props.firmware)} 
                selectBatteryAdapter={() => this.selectBatteryAdapter(this.props.device, this.props.firmware)} 
              />

            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

  logoContainerStyle: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    flex: 5,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    marginBottom: 16,
  },

  scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },

  buttonViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: "10%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cccccc'
  },

  buttonTextStyle: {
    fontSize: 12,
    paddingVertical: 5,
    paddingLeft: 10,
  },

  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  bottomModalContainer: {
    maxHeight: '50%',
    paddingBottom: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'space-around',
  },

  bottomModalOption: {
    width: '100%',
    height: 48,
    justifyContent: 'space-around',
    borderBottomColor: '#CBD2DE',
    borderBottomWidth: 1,
  },

  bottomOptionValue: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
  },

  buttonRowWrap: {
    paddingHorizontal: 16,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dormantButton: {
    width: 100,
    backgroundColor: '#1F6BFF',
    marginVertical: 8,
    paddingVertical: 8,
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },

  subTitle: {
    marginTop: 4,
    color: '#8F97A3',
    fontSize: 12,
  },

  activateText: {
    fontWeight: 'bold',
    color: '#fff',
  },

  label: {
    fontSize: 16,
    color: '#101114',
  },

  labelWrap: {
    flex: 1,
  },

  popupDialogStyle: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.18,
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
    alignSelf: 'center'
  },

  cancelButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#191919',
  },

  okButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#ff3b47'
  },
})

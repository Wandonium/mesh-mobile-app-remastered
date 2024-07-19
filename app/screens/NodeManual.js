import NetInfo from '@react-native-community/netinfo'
import React, { Component } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native'
import Dialog, { DialogFooter, DialogButton, DialogContent, ScaleAnimation } from '../library/react-native-popup-dialog/index'
import { Button, DefaultHeaderHOC, Field, SelectBox, Switch } from '../components'
import { GEOLOCATION_OPTIONS } from '../components/Map'
import { AlertHelper, BLEService } from '../services'
import { base64ToBytes } from '../services/base64'
import cachingService from '../services/CachingService'
import Geolocation from '../services/GeoDep'
import { ManageThemeContext } from '../theme/ThemeManager'

const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height
const barHeight = (screenHeight - 179) * 0.015

const STOP_SEARCH_TIMEOUT_MS = 3 * 1000
const CONNECT_TIMEOUT_MS = 8 * 1000
const FORCE_DISCONNECT_TIMEOUT_MS = 1500

const batterySettingDataArrayV04 = [48, 49]

export default class NodeManual extends Component {
  constructor(props) {
    super()

    this.searchTimeout = null
    this.connectTimeout = null
    this.nrfForceDisconnectTimeout = null

    this.read_version_counter = 0
    this.repeatCount = 0
    this.connectRetry = 0
    this.preActionWithNodeFlagSet = false
    const defaultParams = {
      qr: {
        name: '',
        mac: '',
      },
      node: {
        name: '',
        mac: '',
        full_address: '',
        lat: '',
        lng: '',
        country_short_name: '',
      },
      network: null,
    }

    let { params } = props.route
    params = { ...defaultParams, ...params }

    this.state = {
      isEditableMAC: true,
      name: params.node.name || params.qr.name,
      mac: params.node.mac || params.qr.mac || '',
      associatedNetwork: params.network,
      location: {
        address: params.node.full_address,
        latitude: params.node.lat,
        longitude: params.node.lng,
      },
      country_short_name: params.node.country_short_name,
      currentPosition: null,
      cpString: null,
      isNetConnected: null,
      macOverlayIsVisible: false,
      bleForceDisconnect: false,
      nodeNotFound: false, 
      baddNodeOverlayIsVisible: ((params.mode) && (params.mode === 'badNode')) ? true : false,
      badMacRecoveryStep: 1, 
      badNodeNewMac: '', 
      badNodePowerSource: ''
    }
  }

  checkNetStatus = async () => {
    const { isConnected } = await NetInfo.fetch()
    this.setState({ isNetConnected: isConnected })
  }

  componentDidMount() {
    console.log('[NodeManual.js] - componentDidMount: ', this.props.route.params?.mode)
    this.checkNetStatus()

    this.bleDiscoverDeviceListener = BLEService.bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      this.onDiscoverDevice,
    )
    if((this.props.route.params?.fromBLE === false)) {
      console.log('[NodeManual.js] - Come from Network, start new scan ')
      this.freshScan()
    }
    this.focusListener = this.props.navigation.addListener('focus', async (navigation) => {
      console.log('[NodeManual.js] - device:', this.props.device)
      if(this.props.device) {
        BLEService.retrieveServices(this.props.device.id)
          .then((result) => {
            console.log('[NodeManual.js] - Retrieved Services:', result)
            BLEService.checkEnabled(this.props.device)
          })
          .catch((err) => {
            console.log('[NodeManual.js] - Could not retrieve Services: ', err)
            if(this.props.route.params?.fromBLE === false) {
              this.freshScan()
            }
          })
      }

      this.bleServiceUpdateListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        this.onServiceUpdate.bind(this),
      )

      this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        this.onDeviceDisconnect.bind(this),
      )
    })

    this.blurListener = this.props.navigation.addListener('blur', () => {
      console.log('[NodeManual.js] - willBlur')
      if (this.bleServiceUpdateListener) this.bleServiceUpdateListener.remove()
      if (this.bleDisconnectListener) this.bleDisconnectListener.remove()
      if (this.bleDiscoverDeviceListener) this.bleDiscoverDeviceListener.remove()
      if (this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
    })
  }

  componentWillUnmount() {
    console.log('[NodeManual.js] - componentWillUnmount')
    this.closeOverlay()
    this.focusListener()
    this.blurListener()

    if (this.bleServiceUpdateListener) this.bleServiceUpdateListener.remove()
    if (this.bleDisconnectListener) this.bleDisconnectListener.remove()
    if (this.bleDiscoverDeviceListener) this.bleDiscoverDeviceListener.remove()
    if (this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
  }

  onServiceUpdate = ({ value, peripheral, characteristic, service }) => {
    console.log('[NodeManual.js] - onServiceUpdate')
    if (
      characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
      characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
    ) {
      console.log('[NodeManual.js] - BLE_UART_READ_UUID Update')
      const byteValue = base64ToBytes(value)
      if ([166, 161].includes(byteValue.readUInt8(0)) && [1, 3].includes(byteValue.readUInt8(1))) {
        let isLoadEnabled = !!byteValue.readUInt8(2)
        this.props.bleLoadEnabled(isLoadEnabled)
        if (this.connectTimeout) clearTimeout(this.connectTimeout)
      }
    }
    if (
      characteristic === '00002a19-0000-1000-8000-00805f9b34fb' ||
      characteristic === '00002A19-0000-1000-8000-00805F9B34FB' ||
      characteristic === '2a19' ||
      characteristic === '2A19'
    ) {
      let batteryValue = `${value}%`
      console.log('[NodeManual.js] - BLE_BATTERY_UPATE_UUID Update', batteryValue)
      this.props.bleBatteryUpdate(batteryValue)
    }
  }

  forceNRFDisconnect() {
    if(this.props.route.params?.fromBLE === true) {
      if(this.preActionWithNodeFlagSet === true) {
        this.preActionWithNodeFlagSet = false
        this.actionWithNode()
      }
      else {
        this.props.navigation.goBack(null)
      }
    }
    else if(!this.props.device) {
      this.props.navigation.goBack(null)
    }
    else {
      if(this.state.nodeNotFound === true){
        this.props.navigation.goBack(null)
      }
      else {
        if(this.props.device) BLEService.nrfDisconnectBle(this.props.device)
        this.setState({ bleForceDisconnect: true })
        this.nrfForceDisconnectTimeout = setTimeout(() => {
          console.log('[NodeManual.js] - Force NRF Disconnect Timeout')
          this.disconnect()
          return
        }, FORCE_DISCONNECT_TIMEOUT_MS)
      }
    }
  }

  disconnect() {
    if (this.props.device && this.props.characteristic) {
      console.log('[NodeManual.js] - Disconnecting Device', this.props.characteristics)
      if (Platform.OS === 'android') {
        this.props.bleServiceUnsubscribed()
        BLEService.disconnectDevice(this.props.device.id)
      }
      else {
        this.unsubscribeBLEServices()
          .then(() => {
            BLEService.disconnectDevice(this.props.device.id)
          })
          .catch(() => {
            BLEService.disconnectDevice(this.props.device.id)
          })
      }
    }
  }

  onDeviceDisconnect() {
    if(this.props.device === null) return
    console.log('[NodeManual.js] - onDeviceDisconnect', this.bleServiceUpdateListenerSet, this.bleDisconnectListenerSet)
    if (this.bleServiceUpdateListener) this.bleServiceUpdateListener.remove()
    if (this.bleDisconnectListener) this.bleDisconnectListener.remove()
    if(this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)
    // If the disconnection happened because of device side disconnect
    if(this.props.characteristics) {
      this.props.bleServiceUnsubscribed()
    }
    if(this.state.badMacRecoveryStep === 3) {
      this.setState({ baddNodeOverlayIsVisible: false,  badMacRecoveryStep: 1}) 
    }
    if(Platform.OS === 'android') {
      BLEService.removePeripheral(this.props.device.id)
        .then(() => {
          console.log('[NodeManual.js] - Device peripheral remove success')
          this.setState({ bleForceDisconnect: false })
          this.props.bleDeviceDisconnected()
          if(this.props.route.params?.fromBLE === true) {
            if(this.preActionWithNodeFlagSet === true) {
              this.preActionWithNodeFlagSet = false
              this.actionWithNode()
            }
            else {
              this.props.navigation.navigate('BLESearch', {
                fromBLE: true,
              })
            }
          }
          else {
            this.props.navigation.goBack(null)
          }
        })
        .catch(() => {
          console.log('[NodeManual.js] - Device peripheral remove fail')
          this.setState({ bleForceDisconnect: false })
          this.props.bleDeviceDisconnected()
          if(this.props.route.params?.fromBLE === true) {
            if(this.preActionWithNodeFlagSet === true) {
              this.preActionWithNodeFlagSet = false
              this.actionWithNode()
            }
            else {
              this.props.navigation.navigate('BLESearch', {
                fromBLE: true,
              })
            }
          }
          else {
            this.props.navigation.goBack(null)
          }
        })
    }
    else {
      this.setState({ bleForceDisconnect: false })
      this.props.bleDeviceDisconnected()
      if(this.props.route.params?.fromBLE === true) {
        if(this.preActionWithNodeFlagSet === true) {
          this.preActionWithNodeFlagSet = false
          this.actionWithNode()
        }
        else {
          this.props.navigation.navigate('BLESearch', {
            fromBLE: true,
          })
        }
      }
      else {
        this.props.navigation.goBack(null)
      }
    }

  }

  onPowerSwitch = () => {
    if (this.props.isLoadEnabled === true) {
      console.log('[NodeManual.js] - onPowerOff')
      BLEService.turnOffDevice(this.props.device)
      this.props.bleLoadEnabled(false)
    } else {
      console.log('[BLESearch.js] - onPowerOn')
      BLEService.turnOnDevice(this.props.device)
      this.props.bleLoadEnabled(true)
    }
  }

  changeMacAddress = (text) => {
    const r = /([a-z0-9]{2})([a-z0-9]{2})/i
    let str = text.replace(/[^a-z0-9]/gi, '')
    while (r.test(str)) {
      str = str.replace(r, '$1' + ':' + '$2')
    }

    this.setState({ mac: str.slice(0, 17).toUpperCase() })
  }

  enterMacAddress = (text) => {
    const r = /([a-z0-9]{2})([a-z0-9]{2})/i
    let str = text.replace(/[^a-z0-9]/gi, '')
    while (r.test(str)) {
      str = str.replace(r, '$1' + ':' + '$2')
    }

    this.setState({ badNodeNewMac: str.slice(0, 17).toUpperCase() })
  }

  endEditingMac = () => {
    if(this.props.route.params?.qr) {
      console.log('[NodeManual.js] - endEditingMac qr', this.props.route.params?.qr.mac, this.state.mac)
      if(this.props.route.params?.qr.mac != this.state.mac) {
        console.log('[NodeManual.js] - New Mac', this.state.mac.slice(9))
        if(this.state.mac.length === 17)
          this.setState({ macOverlayIsVisible: true })
      }
    }
    else if(this.props.route.params?.node) {
      console.log('[NodeManual.js] - endEditingMac node', this.props.route.params?.node.mac, this.state.mac)
      if(this.props.route.params?.node.mac != this.state.mac) {
        console.log('[NodeManual.js] - New Mac', this.state.mac.slice(9))
        if(this.state.mac.length === 17)
          this.setState({ macOverlayIsVisible: true })
      }
    }
  }

  recoverBadNodeAdapter = () => {
    if (this.props.device) {
      console.log("[NodeManual.js] - Setting Battery Absent")
      BLEService.setBatteryPack(this.props.device, batterySettingDataArrayV04[0]);
      setTimeout(() => {
        console.log("[NodeManual.js] - Turning on Device")
        BLEService.turnOnDevice(this.props.device)
      }, 200)
    }
  }

  endEnteringMac = () => {
    console.log('[NodeManual.js] - New Mac', this.state.badNodeNewMac, this.state.badNodeNewMac.length)
    if(this.state.badNodeNewMac.length === 17) {
      BLEService.changeAddress(this.props.device, this.state.badNodeNewMac.slice(9))
      this.setState({ badMacRecoveryStep: 3 })
    }
    else {
      AlertHelper.alert('error', 'Error', 'MAC Address incorrect')
    }
  }

  badNodeSelectBattery = () => {
    console.log('[NodeManual.js] - badNodeSelectBattery')
    this.setState({ badNodePowerSource: 'battery', badMacRecoveryStep: 2 })
  }

  badNodeSelectAdapter = () => {
    console.log('[NodeManual.js] - badNodeSelectAdapter')
    this.recoverBadNodeAdapter()
    this.setState({ badNodePowerSource: 'adapter', badMacRecoveryStep: 2 })
  }

  onPressCancel = () => {
    if((this.props.route.params?.mode) && (this.props.route.params?.mode === 'manual')) {
      this.props.navigation.goBack(null)
    }
    else {
      this.forceNRFDisconnect()
    }
  }

  onSelectAssociatedNetwork = () => {
    this.props.navigation.navigate('AssociatedNetwork', {
      setAssociatedNetwork: (associatedNetwork) => {
        this.setState({ associatedNetwork })
      },
    })
  }

  onSetNetworkCoords = (address, country_short_name, latitude, longitude) => {
    this.setState({ country_short_name, location: { address, latitude, longitude } })
  }

  onLocationSelect = async () => {
    const { address, latitude, longitude } = this.state.location
    const isCreate = (this.props.route.params?.mode !== 'create' && this.props.route.params?.mode !== 'manual') || (address && latitude && longitude)
    console.log('[NodeManual.js] - onLocationSelect', isCreate)
    this.props.navigation.navigate('Location', {
      currentRegion: isCreate ? { full_address: address, latitude, longitude } : null,
      onSetNetworkCoords: this.onSetNetworkCoords,
    })
  }

  onAboutPage = async () => {
    this.props.navigation.navigate('AboutPage', {
      fromBLE: true,
      mac: this.state.mac,
    })
  }

  preActionWithNode = () => {
    this.preActionWithNodeFlagSet = true
    if((this.props.route.params?.mode) && (this.props.route.params?.mode === 'manual')) {
      this.actionWithNode()
    }
    else {
      this.forceNRFDisconnect()
    }
  }

  actionWithNode = () => {
    console.log('[NodeManual.js] - actionWithNode')
    const {
      mac,
      name,
      location,
      associatedNetwork,
      country_short_name,
      cpString,
      currentPosition,
      isNetConnected,
    } = this.state
    const { navigation, route, createNode, editNode } = this.props

    if (isNetConnected) {
      if (mac && name && location && associatedNetwork) {
        const data = {
          mac,
          name,
          lat: location.latitude,
          lng: location.longitude,
          full_address: location.address,
          country_short_name,
        }

        if (route.params?.mode === 'create' || route.params?.mode === 'manual') {
          createNode(navigation, associatedNetwork, data, route.params?.newNetwork)
        } else {
          const { node, network } = this.props.route.params
          editNode(navigation, {
            ...data,
            id: node.id,
            networkId: network.id,
            network: associatedNetwork.id,
          })
        }
      } else {
        AlertHelper.alert('error', 'Alert', 'All fields are required')
      }
    } else {
      console.log('gsemotpgnrsj')
      if (currentPosition && mac && name && associatedNetwork) {
        const isCoords = /^(-?\d+(\.\d+)?);(-?\d+(\.\d+)?)$/.test(cpString)
        if (!isCoords) return AlertHelper.alert('error', 'Location is incorrect', 'Location format has to be "lat;lon"')
        const data = {
          mac,
          name,
          lat: currentPosition.latitude,
          lng: currentPosition.longitude,
        }

        if (route.params?.mode === 'create') {
          const status = cachingService.saveNodeData({
            data,
            navigation,
            associatedNetwork,
            navParam: route.params?.newNetwork,
          })
          if (status === 'failed') {
            console.log('failed to save data')
            return AlertHelper.alert('error', 'Your node setup failed', 'Please try again later')
          }

          navigation.navigate('BLESearchOffline', { shouldReloadNodeSearch: true })
          AlertHelper.alert(
            'info',
            'Your node setup is saved',
            'We will connect it once internet connection is restored',
          )
        }
      } else {
        AlertHelper.alert('info', 'Alert', 'All fields are required')
      }
    }
  }

  takeCurrentPosition = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('current position', longitude, latitude)
        this.setState({
          currentPosition: { latitude, longitude },
          cpString: `${latitude};${longitude}`,
        })
      },
      (error) => {
        console.warn('error getting current position from offline request', error)
        return AlertHelper.alert(
          'error',
          "Couldn't find your position",
          'Please check if you have location turned on or try again later',
        )
      },
      GEOLOCATION_OPTIONS,
    )
  }

  onLocationChange = (text) => {
    const pos = text.split(';')
    this.setState({ cpString: text, currentPosition: { latitude: pos[0], longitude: pos[1] } })
  }

  static getDerivedStateFromProps(props) {
    if (props.route.params?.clearState) {
      props.navigation.setParams({ clearState: false })
      return {
        name: '',
        mac: '',
        associatedNetwork: null,
        location: {
          address: '',
          latitude: 0,
          longitude: 0,
        },
        country_short_name: '',
      }
    }
    return null
  }

  freshScan = () => {
    this.repeatCount = 0
    this.bleScan.call(this, true)
  }

  repeatScan = () => {
    this.repeatCount ++
    this.bleScan.call(this, true)
  }

  bleScan(isRepeat = false) {
    if(this.searchTimeout) clearTimeout(this.searchTimeout)

    BLEService.startScan()
      .then(() => {
        console.log('[NodeManual.js] - started scan')
        this.props.bleSearchStart()
        this.searchTimeout = setTimeout(() => {
          console.log('[NodeManual.js] - Scanning Timeout')
          BLEService.stopScan()
          if((this.repeatCount < 3) && (isRepeat === true)) {
            console.log("[NodeManual.js] - repeatCount", this.repeatCount)
            this.repeatScan()
          }
          else {
            console.log('[NodeManual.js] - nodeNotFound')
            this.setState({ nodeNotFound: true })
            this.props.bleSearchStop()
          }
        }, STOP_SEARCH_TIMEOUT_MS)
      })
      .catch(() => {
        console.log('[NodeManual.js] - start scan error')
      })
  }

  onDiscoverDevice = (device) => {
    if(this.props.connecting === device.id) return
    if(device.advertising.localName === undefined) return
    const localNameMac = device.advertising.localName.slice(7)
    console.log('[NodeManual.js] - onDiscoverDevice', localNameMac, )
    if (localNameMac && (localNameMac.toLowerCase() === this.props.route.params?.node.mac.toLowerCase())) {
      console.log('[NodeManual.js] - Discovery device Name match')
      if(this.searchTimeout) clearTimeout(this.searchTimeout)
      BLEService.stopScan()
      this.connectRetry = 0
      this.connectToDevice(device)
    }
  }

  connectToDevice = async (device) => {
    console.log('[NodeManual.js] - Connecting Device')
    this.connectRetry ++
    /*this.props.bleDeviceConnecting(device.id)
    console.log("[NodeManual.js] - before BLEService.connectDevice device id: ", device.id)*/
    BLEService.connectDevice(device.id)
      .then(() => {
        // Success code
        console.log('[NodeManual.js] - Device Connected: ', device.advertising.localName, device.id)
        //BLEService.stopScan()
        //this.props.bleSearchStop()
        this.props.bleDeviceConnected(device)
        this.subscribeBLEServices().then(() => {
          console.log('[NodeManual.js] - connectToDevice: ', device)
        })
      })
      .catch((e) => {
        // Failure code
        console.log('[NodeManual.js] - Connecting Device error: ' + e)
      })
    this.connectTimeout = setTimeout(() => {
      console.log('[NodeManual.js] - Connecting Timeout, retry ', this.connectRetry)
      if(this.connectRetry === 3) {
        AlertHelper.alert('error', 'Error', 'Failure connecting to device, please retry')
        this.props.bleDeviceConnectTimeout()
        this.disconnect()
      }
      else {
      this.disconnect()
      this.connectToDevice(device)
      }
    }, CONNECT_TIMEOUT_MS)
  }

  subscribeBLEServices() {
    console.log('[NodeManual.js] - subscribeBLEServices')
    return new Promise((resolve, reject) => {
      console.log("[NodeManual.js] - this.props: ", this.props)
      if(this.props.device) {
        console.log('[NodeManual.js] - device:', this.props.device)
        BLEService.retrieveServices(this.props.device.id)
          .then((result) => {
            this.props.bleCharacteristicsDiscovered(result)
            console.log('[NodeManual.js] - Characteristics: ', result.characteristics)
  
            let characteristics = result.characteristics
            let index = characteristics.findIndex(
              (characteristic) =>
                characteristic.characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
                characteristic.characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
            )
            let char = characteristics[index]
            console.log('[NodeManual.js] - char: ', char)
            BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
              .then((result) => {
                console.log('[NodeManual.js] - Subscribed to BLE UART Characteristic')
                index = characteristics.findIndex(
                  (characteristic) =>
                    characteristic.characteristic === '2a19' ||
                    characteristic.characteristic === '2A19' ||
                    characteristic.characteristic === '00002a19-0000-1000-8000-00805f9b34fb' ||
                    characteristic.characteristic === '00002A19-0000-1000-8000-00805F9B34FB',
                )
                console.log('[NodeManual.js] - BAS index', index)
                char = characteristics[index]
                BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
                  .then((result) => {
                    console.log('[NodeManual.js] - Subscribed to BLE Battery Characteristic')
                    this.props.bleServiceSubscribed(characteristics)
                    BLEService.checkEnabled(this.props.device)
                    resolve()
                  })
                  .catch((error) => {
                    console.log('[NodeManual.js] - Cannot Subscribe to BLE Battery Characteristic: ', error)
                  })
              })
              .catch((error) => {
                console.log('[NodeManual.js] - Cannot Subscribe to BLE UART Characteristic: ', error)
              })
          })
          .catch((error) => {
            console.log('[NodeManual.js] - Could not retrieve Services: ', error)
          })
      } else {
        console.log("[NodeManual.js] - this.props.device is null so we reject promise...");
        reject();
      }
    });
  }

  unsubscribeBLEServices() {
    console.log('[NodeManual.js] - unsubscribeBLEServices')

    let characteristics = this.props.characteristics
    let index = characteristics.findIndex(
      (characteristic) =>
        characteristic.characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
        characteristic.characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
    )
    let char = characteristics[index]
    console.log('[NodeManual.js] - Characteristics: ', char)
    return new Promise((resolve, reject) => {
      BLEService.stopNotification(this.props.device.id, char.service, char.characteristic)
        .then((result) => {
          console.log('[NodeManual.js] - Unsubscribed to BLE UART Characteristic')
          index = characteristics.findIndex(
            (characteristic) =>
              characteristic.characteristic === '2a19' ||
              characteristic.characteristic === '2A19' ||
              characteristic.characteristic === '00002a19-0000-1000-8000-00805f9b34fb' ||
              characteristic.characteristic === '00002A19-0000-1000-8000-00805F9B34FB',
          )
          char = characteristics[index]

          BLEService.stopNotification(this.props.device.id, char.service, char.characteristic)
            .then((result) => {
              this.props.bleServiceUnsubscribed()
              resolve()
              console.log('[NodeManual.js] - Unsubscribed to BLE Battery Characteristic')
            })
            .catch((error) => {
              console.log('[NodeManual.js] - Cannot Unsubscribe to BLE Battery Characteristic: ', error)
              reject()
            })
        })
        .catch((error) => {
          console.log('[NodeManual.js] - Cannot Unsubscribe to BLE UART Characteristic: ', error)
          reject()
        })
    })
  }

  closeOverlay = () => {
    if(this.props.route.params?.qr) {
      this.setState({ macOverlayIsVisible: false, mac: this.props.route.params?.qr.mac })
    }
    else if(this.props.route.params?.node) {
      this.setState({ macOverlayIsVisible: false, mac: this.props.route.params?.node.mac })
    }
  }

  closeBadNodeOverlay = () => {
    this.setState({ baddNodeOverlayIsVisible: false })
  }

  confirmChangeMacAddress = () => {
    console.log('[NodeManual.js] - confirmChangeMacAddress')
    this.setState({ macOverlayIsVisible: false })
    BLEService.changeAddress(this.props.device, this.state.mac.slice(9))
  }

  renderPopup = () => {
    if((this.props.route.params?.mode) && (this.props.route.params?.mode === 'badNode') && (this.state.baddNodeOverlayIsVisible === true)) {
      if(this.state.badMacRecoveryStep === 1) {
        return (
          <ManageThemeContext.Consumer>
            {({ theme }) => (
              <Dialog
                visible={this.state.baddNodeOverlayIsVisible}
                width={0.7}
                height={0.24}
                dialogAnimation={new ScaleAnimation()}
                footer={
                  <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                    <DialogButton
                      text="BATTERY"
                      textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                      onPress={() => this.badNodeSelectBattery()} />
                    <DialogButton
                      text="12V ADAPTER"
                      textStyle={styles.okButtonText}
                      onPress={() => this.badNodeSelectAdapter()} />
                  </DialogFooter>
                }
              >
                <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                  <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                    Is the device running on battery power or 12V adapter?
                  </Text>
                </DialogContent>
              </Dialog>
            )}
          </ManageThemeContext.Consumer>
        )
      }
      else if(this.state.badMacRecoveryStep === 2) {
        return (
          <ManageThemeContext.Consumer>
            {({ theme }) => (
              <Dialog
                visible={this.state.baddNodeOverlayIsVisible}
                width={0.7}
                height={0.24}
                dialogAnimation={new ScaleAnimation()}
                footer={
                  <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                    <DialogButton
                      text="CANCEL"
                      textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                      onPress={() => this.closeBadNodeOverlay()} />
                    <DialogButton
                      text="CONFIRM"
                      textStyle={styles.okButtonText}
                      onPress={() => this.endEnteringMac()} />
                  </DialogFooter>
                }
              >
                <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                  <View style={styles.fieldWrap}>
                    <Text style={{ ...styles.label, color: theme.primaryText }}>{"Enter MAC Address of the node"}</Text>
                    <View style={styles.fieldContainer}>
                      <TextInput
                        testID={"NodeManualBadNode"}
                        editable={true}
                        returnKeyType={'done'}
                        autoCapitalize={"characters"}
                        value={this.state.badNodeNewMac.toUpperCase()}
                        onChangeText={(text) => this.enterMacAddress(text)}
                        style={[
                          { ...styles.field, borderColor: theme.primaryBorder, color: theme.primaryText },
                        ]}
                        secureTextEntry={false}
                        placeholder={"Enter MAC Address"}
                        placeholderTextColor={theme.primaryLightGray}
                      />
                    </View>
                  </View>
                </DialogContent>
              </Dialog>
            )}
          </ManageThemeContext.Consumer>
        )
      }
      else {
        return (
          <ManageThemeContext.Consumer>
            {({ theme }) => (
              <Dialog
                visible={this.state.baddNodeOverlayIsVisible}
                width={0.7}
                height={0.18}
                dialogAnimation={new ScaleAnimation()}
              >
                <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                  <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                    Disconnecting...
                  </Text>
                </DialogContent>
              </Dialog>
            )}
          </ManageThemeContext.Consumer>
        )
      }
    }
    else {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.state.macOverlayIsVisible}
              width={0.7}
              height={0.24}
              dialogAnimation={new ScaleAnimation()}
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="CANCEL"
                    textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                    onPress={() => this.closeOverlay()} />
                  <DialogButton
                    text="CONFIRM"
                    textStyle={styles.okButtonText}
                    onPress={() => this.confirmChangeMacAddress()} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Changing MAC Address will result in a system restart. Confirm MAC Address Change?
                </Text>
              </DialogContent>
            </Dialog>
          )}
        </ManageThemeContext.Consumer>
      )
    }
  }

  render() {
    const { location, mac = '', isEditableMAC, associatedNetwork, name, cpString, isNetConnected } = this.state
    const { navigation, route } = this.props
    const isNewNetwork = route.params?.newNetwork
    const isNodeEdit = route.params?.node
    const buttonTitle = ((route.params?.mode === 'create') || (route.params?.mode === 'manual')) ? 'Setup' : 'Apply'
    //const { software_version = 'N/A' } = isNodeEdit || { software_version: 'N/A' }

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC
            title={`${((route.params?.mode === 'create') || (route.params?.mode === 'manual')) ? 'Setup New' : (route.params?.mode === 'badNode') ? 'Recover' : 'Edit'} Node`}
            navigation={navigation}
            disableBackButton={true}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            {this.renderPopup()}
              <ScrollView>
                <View
                  style={{
                    ...styles.section,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <View style={styles.fieldsWrap}>
                    <Field
                      testID="NodeManualName"
                      label="Node Name"
                      value={name}
                      placeholder="Enter Node Name"
                      onChangeText={(nodeName) => this.setState({ name: nodeName })}
                    />
                    <Field
                      testID="NodeManualMAC"
                      label="MAC Address"
                      value={mac.toUpperCase()}
                      placeholder="Enter MAC Address"
                      autoCapitalize="characters"
                      editable={!!(isEditableMAC || isNodeEdit)}
                      onChangeText={(text) => this.changeMacAddress(text)}
                      onEndEditing={() => this.endEditingMac()}
                    />
                  </View>

                  <SelectBox
                    testID="NodeManualAssociatedNetwork"
                    title="Associated network"
                    subTitle={associatedNetwork ? associatedNetwork.name : 'Network name'}
                    onPress={!isNewNetwork ? this.onSelectAssociatedNetwork : null}
                  />
                  {isNetConnected ? (
                    <SelectBox
                      testID="NodeManualLocation"
                      title="Location"
                      subTitle={location && location.address.length > 3 ? location.address : 'Adress, City, Index'}
                      onPress={this.onLocationSelect}
                    />
                  ) : (
                    <>
                      <SelectBox
                        testID="LocationSelectOffline"
                        title="Location"
                        subTitle="Choose your current location"
                        onPress={this.takeCurrentPosition}
                      />
                      <View style={styles.fieldsWrap}>
                        <Field
                          testID="OfflineLocationSetup"
                          label="Location"
                          placeholder="Enter your latitude and longitude"
                          autoCapitalize="none"
                          value={cpString}
                          editable={true}
                          onChangeText={this.onLocationChange}
                        />
                      </View>
                    </>
                  )}

                  {isNodeEdit && (
                    <>
                      <Text style={styles.sectionTitle}>BLUETOOTH OPTIONS</Text>
                      {((!this.props.device) || (this.state.bleForceDisconnect)) && (
                        <Button
                          text={
                            // eslint-disable-next-line no-nested-ternary
                            this.props.connecting
                              ? 'Connecting...'
                              : this.props.isSearching
                              ? 'Searching...'
                              : this.state.bleForceDisconnect
                              ? 'Disconnecting...'
                              : this.state.nodeNotFound
                              ? 'Node Not Found, Click to Retry'
                              : 'Connect via BLE for additional options'
                            // 'We haven’t found this Node nearby.\nPlease get closer to the Node'
                          }
                          onPress={this.freshScan}
                          disabled={this.props.connecting || this.props.isSearching}
                        />
                      )}
                    </>
                  )}

                  {(this.props.device) && (!this.state.bleForceDisconnect) && (
                    <>
                      <SelectBox testID="NodeFrimwareUpdate" title="About" onPress={this.onAboutPage} />

                      <View style={[styles.fieldsWrap, styles.bottomMargin]}>
                        <Switch
                          label="Power"
                          subTitle="Warning: removing power will turn off Wi-Fi"
                          disabled={!this.props.device}
                          onValueChange={this.onPowerSwitch.bind(this)}
                          value={this.props.isLoadEnabled}
                        />
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
              <View>
                <Button active testID="NodeManualSetup" text={buttonTitle} disabled={this.props.connecting || this.state.bleForceDisconnect} onPress={this.preActionWithNode} />
                <Button text="Cancel" disabled={this.props.connecting || this.state.bleForceDisconnect} onPress={this.onPressCancel} />
              </View>
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

  section: {
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    marginBottom: 24,
  },

  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  fieldsWrap: {
    paddingHorizontal: 16,
  },

  bottomMargin: {
    marginBottom: 16,
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

  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fieldWrap: {
    marginTop: 16,
  },

  label: {
    fontSize: 16,
    color: '#101114',
  },

  field: {
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },

  disableBorderBottom: {
    borderBottomWidth: 0,
  },

})

/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
import LottieView from 'lottie-react-native'
import React, { PureComponent } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Linking,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ToastAndroid
} from 'react-native'
import { openSettings } from 'react-native-permissions'
import { Button, FieldBG, StackHeader, UniversalItem } from '../components'
import { NetworkContext } from '../components/NetworkProvider'
import { Battery, BluetoothNotWorking, NodeWireframe } from '../components/svg'
import { AlertHelper, BLEService, getDischargeEstim, FirmwareUpdateService } from '../services'
import Dialog, { 
  DialogFooter, 
  DialogButton, 
  DialogContent,
  ScaleAnimation,
} from '../library/react-native-popup-dialog/index'
import { base64ToBytes } from '../services/base64'
import { ManageThemeContext } from '../theme/ThemeManager'
import * as Progress from 'react-native-progress'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { API } from '../actions';

const STOP_SEARCH_TIMEOUT_MS = 10 * 1000
const CONNECT_TIMEOUT_MS = 5 * 1000
const FORCE_DISCONNECT_TIMEOUT_MS = 1500
const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height

const batterySettingDataArrayV04 = [48, 49]

const TEXTS = [
  "Loading Network.",
  "Loading Network..",
  "Loading Network..."
]

export default class BLESearch extends PureComponent {
  static contextType = NetworkContext

  constructor(props) {
    super()
    this.counter = 0
    this.searchTimeout = null
    this.checkSearchEmptyTimeout = null
    this.connectTimeout = null
    this.nrfForceDisconnectTimeout = null

    this.focusListener = null
    this.blurListener = null
    this.backHandler = null
    this.deviceMap = new Map()

    this.read_fw_version_counter = 0
    this.read_hw_version_counter = 0
    this.bleServiceUpdateListenerSet = false
    this.bleDisconnectListenerSet = false
    this.deviceToConnect = ''
    this.searchCount = 0
    this.deleteText = false
    this.goingToNodeManual = false
    this.state = {
      isBluetoothEnabled: false,
      details: false,
      devices: [],
      newNodes: [],
      otherNodes: [],
      filteredNetworks: [],
      badNodes: [],
      searchQuery: '',
      repeatCount: 0,
      bleForceDisconnect: false,
      badBLEDisconnect: false,
      badBLEDisconnectOverlayIsVisible: false,
      bleRestartInProgress: false,
      badSearch: false,
      badSearchQuery: false,
      badSearchQueryMask: false,
      otherUserWarningVisible: false,
      progressIndex: 0,
      progressPer: 0,
      // this should either be 'scan' for when we show nodes found after scanning using bluetooth
      // or 'sort' for showing a particular node after we make server call to determine whether
      // the node is already in a network or not.
      showNode: 'scan',
      selectedNodes: [],
      currentUserAps: [],
      otherUsersAps: []
    }
  }

  componentDidMount() {
    const { navigation, isNetworkAddNode } = this.props
    const { device, isBluetoothEnabled } = this.state
    
    this.props.bleInit()
    this.focusListener = navigation.addListener('focus', async () => {
      console.log('[BLESearch.js] - didFocus', this.searchCount, this.props.loadingProgress)
      this.goingToNodeManual = false
      if(this.props.device) {
        BLEService.retrieveServices(this.props.device.id)
        .then((result) => {
          this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
            'BleManagerDisconnectPeripheral',
            this.onDeviceDisconnect.bind(this),
          )
          this.bleDisconnectListenerSet = true
          console.log('[BLESearch.js] - Retrieved Services:', result)
          this.forceNRFDisconnect()
        })
        .catch((err) => {
          console.log('[BLESearch.js] - Could not retrieve Services: ', err)
        })
        
      }
      
      this.discoverDeviceHandlerListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        this.discoverDeviceHandler.bind(this),
      )
      this.stopScanHandlerListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerStopScan',
        this.stopScanHandler.bind(this),
      )
      this.bleManagerStateUpdateListener = BLEService.bleManagerEmitter.addListener(
        'BleManagerDidUpdateState',
        this.bleManagerStateUpdateHandler.bind(this),
      )
      BLEService.checkBleState()
      let progressCal = 0
      if(this.props.route.routeName != 'BLESearchOffline') {
        if(this.props.loadingProgress >= 0 && this.props.loadingProgress <= 100) {
          this.setState({ progressPer: this.props.loadingProgress })
        } else {
          this.setState({ progressPer: 0 })
        }
        this.intervalId = setInterval(() => {
          this.setState({ progressIndex: this.state.progressIndex + 1})
        }, 700)
        this.intervalId2 = setInterval(() => {
          if(this.state.progressPer === 100) {
            this.setState({ progressPer: 100 })
          } else {
            this.setState({ progressPer: Number(this.state.progressPer)+1 })
          }
          if(this.state.progressPer >= 0 && this.state.progressPer < 100) {
            this.props.setLoadingProgress(this.state.progressPer)
          }
        }, 2000)
      }
      
    })

    this.blurListener = navigation.addListener('blur', async (e) => {
      console.log('[BLESearch.js] - willBlur', this.goingToNodeManual)
      if(this.props.route.routeName != 'BLESearchOffline') {
        if (this.intervalId) clearTimeout(this.intervalId)
        if (this.intervalId2) clearTimeout(this.intervalId2)
      }
      
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      if (this.checkSearchEmptyTimeout) clearTimeout(this.checkSearchEmptyTimeout)
      if (this.connectTimeout) clearTimeout(this.connectTimeout)
      if (this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)

      
      if (this.bleServiceUpdateListenerSet) this.bleServiceUpdateListener.remove()
      if (this.discoverDeviceHandlerListener) this.discoverDeviceHandlerListener.remove()
      if (this.stopScanHandlerListener) this.stopScanHandlerListener.remove()
      if (this.bleManagerStateUpdateListener) this.bleManagerStateUpdateListener.remove()

      if (this.goingToNodeManual === false) {
        if (this.props.device) this.forceNRFDisconnect()
      }
      else {
        if (this.bleDisconnectListenerSet) this.bleDisconnectListener.remove()
        this.bleDisconnectListenerSet = false
      }
      this.bleServiceUpdateListenerSet = false
      this.searchCount = 0
      BLEService.stopScan()
      this.props.bleSearchStop()
    })

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.context.isConnected && this.context.isInternetReachable) {
        console.log('[BLESearch.js] - backHandler', navigation.canGoBack(), this.props.route.params)
        if (this.props.route.params === undefined) {
          console.log('[BLESearch.js] - go back to Dashboard')
          navigation.navigate('TabScreens', {screen: 'DashboardScreen', params: {screen: 'DashboardScreen'}})
        }
        else if (navigation.canGoBack()) {
          console.log('[BLESearch.js] - canGoBack')
          navigation.goBack()
          return true
        }
        // navigation.navigate(isNetworkAddNode ? 'CreateNetworkAddNode' : 'Dashboard')
      }
    })
  }

  componentWillUnmount() {
    console.log('[BLESearch.js] - componentWillUnmount')
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    if (this.checkSearchEmptyTimeout) clearTimeout(this.checkSearchEmptyTimeout)
    if (this.connectTimeout) clearTimeout(this.connectTimeout)
    if (this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)
    if (this.props.device) this.forceNRFDisconnect()
    if (this.backHandler) this.backHandler.remove()
    this.focusListener()
    this.blurListener()

    if (this.bleServiceUpdateListenerSet) this.bleServiceUpdateListener.remove()
    if (this.discoverDeviceHandlerListener) this.discoverDeviceHandlerListener.remove()
    if (this.stopScanHandlerListener) this.stopScanHandlerListener.remove()
    if (this.bleManagerStateUpdateListener) this.bleManagerStateUpdateListener.remove()

    if (this.bleDisconnectListenerSet) this.bleDisconnectListener.remove()

    this.bleServiceUpdateListenerSet = false
    this.bleDisconnectListenerSet = false
    this.searchCount = 0
    // BLEManager.destroy()
  }

  componentDidUpdate(prevProps) {
    const { loadingCounter, maxNum } = this.props
    if(this.props.route.routeName != 'BLESearchOffline') {
      if(maxNum > 0 && loadingCounter > 0 ) {
        progressCal = (maxNum-loadingCounter)*100/maxNum
        if(progressCal > this.state.progressPer) {
          this.setState({ progressPer: progressCal.toFixed(0) })
        }
      }
      
    }

    if (
      this.context.isConnected &&
      this.context.isInternetReachable &&
      prevProps.route.name === 'BLESearchOffline'
    ) {
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      if (this.checkSearchEmptyTimeout) clearTimeout(this.checkSearchEmptyTimeout)
      BLEService.stopScan()
      this.forceNRFDisconnect()
      this.props.navigation.navigate('Splash')
    }
  }

  selectDeviceName(device) {
    /*
    let localName = device.advertising.localName
    let deviceName = device.name
    if(localName === "MeshPP_SW_Error__BAD_MAC" && deviceName === "MeshPP_SW_Error__BAD_MAC") {
      return "MeshPP_SW_Error__BAD_MAC"
    }
    else if(localName === "MeshPP_SW_Error__BAD_MAC" && deviceName != "MeshPP_SW_Error__BAD_MAC") {
      return deviceName
    }
    else if(localName != "MeshPP_SW_Error__BAD_MAC" && deviceName === "MeshPP_SW_Error__BAD_MAC") {
      return localName
    }
    else {
      return localName
    }
    */
    let localName = device.advertising.localName
    let deviceName = device.name
    if (localName === "" && deviceName != "") {
      return deviceName
    }
    else if (localName != "" && deviceName === "") {
      return localName
    }
    else {
      return localName
    }
  }

  discoverDeviceHandler(device) {
    const { repeatCount, badNodes, newNodes, otherNodes, filteredNetworks } = this.state
    let localName = this.selectDeviceName(device)
    let deviceID = device.id
    let devices = this.deviceMap.size ? [...this.deviceMap.values()] : []
    let names = devices.length ? devices.map(dev => dev.advertising.localName) : [];
    // console.log('[BLESearch.js] - Device Discovered', device)
    if ((localName && this.getMacFromName(localName) && localName.startsWith('MeshPP') && !names.includes(localName)) 
      || (localName === "MeshPP_SW_Error__BAD_MAC")) {
      this.props.bleDeviceDiscovered(device)
      console.log('[BLESearch.js] - Device Found', device)
      this.addDevice(device)
      
      /* let devs = this.state.newNodes
      if(!names.includes(localName)) {
        devs.push(device)
        console.log('devs: ', devs)
        this.setState({newNodes: devs})
      } */
    }
  }

  stopScanHandler() {
    console.log('[BLESearch.js] - stopScanHandler')
    if(this.deviceMap.size === 0) {
      // ToastAndroid.show('Bluetooth Scan Stopped! No MeshPlusPlus Devices found! Restarting Scan...', ToastAndroid.SHORT);
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      BLEService.startScan()
    .then(() => {
      console.log('[BLESearch.js] - Restart Scan Success')
      })
      .catch((error) => {
        console.log('[BLESearch.js] - Restart Scan Error: ', error)
        this.props.bleSearchError(error)
        this.stopSearch()
      })
    }
    else {
      // ToastAndroid.show('Bluetooth Scan Stopped! MeshPlusPlus Devices found!', ToastAndroid.SHORT);
      this.stopSearch()
    }
    //this.props.bleSearchStop()
  }

  bleManagerStateUpdateHandler(args) {
    console.log('[BLESearch.js] - bleManagerStateUpdateHandler', args, this.props.device)
    if (args.state === 'on') {
      if (!this.state.isBluetoothEnabled) this.setState({ isBluetoothEnabled: true })
      if(this.state.bleRestartInProgress === true) {
        setTimeout(() => {
          this.setState({ badBLEDisconnect: false, badBLEDisconnectOverlayIsVisible: false, bleRestartInProgress: false, badSearch: false, badSearchQuery: false })
          this.startFreshScan()
        }, 2000)
      }
      else {
        if (!this.props.device) 
          this.startFreshScan()
        else
          this.stopSearch()
      }
    } else if (args.state === 'off') {
      this.setState({ isBluetoothEnabled: false })
      if(this.state.bleRestartInProgress === true) {
        BLEService.enableBluetooth()
      }
    } else if (args.state === 'unsupported') {
      AlertHelper.alert('error', 'Error', 'Bluetooth is unsupported on this device')
      this.setState({ isBluetoothEnabled: false })
    }
  }

  subscribeBLEServices() {
    console.log('[BLESearch.js] - subscribeBLEServices')
    return new Promise((resolve, reject) => {
      console.log('[BLESearch.js] - device:', this.props.device)
      BLEService.retrieveServices(this.props.device.id)
        .then((result) => {
          this.props.bleCharacteristicsDiscovered(result)
          console.log('[BLESearch.js] - Characteristics: ', result.characteristics)

          let characteristics = result.characteristics
          let index = characteristics.findIndex(
            (characteristic) =>
              characteristic.characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
              characteristic.characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
          )
          let char = characteristics[index]
          console.log('[BLESearch.js] - char: ', char)
          BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
            .then((result) => {
              console.log('[BLESearch.js] - Subscribed to BLE UART Characteristic')
              index = characteristics.findIndex(
                (characteristic) =>
                  characteristic.characteristic === '2a19' ||
                  characteristic.characteristic === '2A19' ||
                  characteristic.characteristic === '00002a19-0000-1000-8000-00805f9b34fb' ||
                  characteristic.characteristic === '00002A19-0000-1000-8000-00805F9B34FB',
              )
              console.log('[BLESearch.js] - BAS index', index)
              char = characteristics[index]
              BLEService.startNotification(this.props.device.id, char.service, char.characteristic)
                .then((result) => {
                  console.log('[BLESearch.js] - Subscribed to BLE Battery Characteristic')
                  this.props.bleServiceSubscribed(characteristics)
                  if (this.bleServiceUpdateListenerSet === false) {
                    console.log('[BLESearch.js] - bleServiceUpdateListenerSet false')
                    this.bleServiceUpdateListener = BLEService.bleManagerEmitter.addListener(
                      'BleManagerDidUpdateValueForCharacteristic',
                      this.onServiceUpdate.bind(this),
                    )
                    this.bleServiceUpdateListenerSet = true
                  }
                  resolve()
                })
                .catch((error) => {
                  console.log('[BLESearch.js] - Cannot Subscribe to BLE Battery Characteristic: ', error)
                })
            })
            .catch((error) => {
              console.log('[BLESearch.js] - Cannot Subscribe to BLE UART Characteristic: ', error)
            })
        })
        .catch((error) => {
          console.log('[BLESearch.js] - Could not retrieve Services: ', error)
        })
    })
  }

  unsubscribeBLEServices() {
    console.log('[BLESearch.js] - unsubscribeBLEServices')

    let characteristics = this.props.characteristics
    let index = characteristics.findIndex(
      (characteristic) =>
        characteristic.characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
        characteristic.characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
    )
    let char = characteristics[index]
    console.log('[BLESearch.js] - Characteristics: ', char)
    return new Promise((resolve, reject) => {
      BLEService.stopNotification(this.props.device.id, char.service, char.characteristic)
        .then((result) => {
          console.log('[BLESearch.js] - Unsubscribed to BLE UART Characteristic')
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
              console.log('[BLESearch.js] - Unsubscribed to BLE Battery Characteristic')
            })
            .catch((error) => {
              console.log('[BLESearch.js] - Cannot Unsubscribe to BLE Battery Characteristic: ', error)
              reject()
            })
        })
        .catch((error) => {
          console.log('[BLESearch.js] - Cannot Unsubscribe to BLE UART Characteristic: ', error)
          reject()
        })
    })
  }

  startFreshScan = () => {
    this.bleScan.call(this)
  }

  bleScan(isRepeat = false) {
    const { repeatCount, devices, newNodes, filteredNetworks } = this.state
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    if (this.checkSearchEmptyTimeout) clearTimeout(this.checkSearchEmptyTimeout)
    if (this.connectTimeout) clearTimeout(this.connectTimeout)
    if (this.props.device) this.forceNRFDisconnect()
    if (!isRepeat) {
      this.setState({ 
        newNodes: [], 
        devices: [], 
        filteredNetworks: [], 
        badNodes: [], 
        otherNodes: [],
        showNode: 'scan' 
      })
      this.deviceMap.clear()
    }

    BLEService.startScan()
      .then(() => {
        console.log('[BLEService.js] - Start Scan Success')
        this.props.bleSearchStart()
        this.searchTimeout = setTimeout(() => {
          console.log('[BLEService.js] - Scanning Timeout')
          this.stopSearch()
        }, STOP_SEARCH_TIMEOUT_MS)
      })
      .catch((error) => {
        console.log('[BLEService.js] - Start Scan Error: ', error)
        this.props.bleSearchError(error)
        this.stopSearch()
      })
  }

  getNewNodes = (notAdopted = [], nodesAdoptedStatus = []) =>
    notAdopted.filter((device) => {
      const mac = this.getMacFromName(this.selectDeviceName(device))
      if (mac) {
        const lowerMac = mac.toLowerCase()
        const node = nodesAdoptedStatus[lowerMac]
        return !node?.exist || null
      }
      return null
    })

  getOtherNodes = (notAdopted = [], nodesAdoptedStatus = []) =>
    notAdopted.filter((device) => {
      const mac = this.getMacFromName(this.selectDeviceName(device))
      if (mac) {
        const lowerMac = mac.toLowerCase()
        const node = nodesAdoptedStatus[lowerMac]
        return (node?.exist && !node?.granted)|| null
      }
      return null
    })

  getEnableExisted = (notAdopted = [], nodesAdoptedStatus = []) =>
    notAdopted.filter((device) => {
      const mac = this.getMacFromName(this.selectDeviceName(device))
      if (mac) {
        const lowerMac = mac.toLowerCase()
        const node = nodesAdoptedStatus[lowerMac]
        return (!!node?.exist && !!node?.granted) || null
      }
      return null
    })

  getFilteredNetworks = (networks = [], adoptedMacs = []) => {
    return networks
      .filter((x) => !!x.aps && !!x.aps.length)
      .map((network) => {
        const nodes = network.aps.filter((node) => (adoptedMacs.includes(node.mac.toUpperCase()) ? { ...node } : null))
        if (nodes.length) {
          return { id: network.id, name: network.name, nodes }
        }
        return null
      })
      .filter((x) => x)
  }


  stopSearch = async (param) => {
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    if (this.checkSearchEmptyTimeout) clearTimeout(this.checkSearchEmptyTimeout)
    const devices = this.deviceMap.size ? [...this.deviceMap.values()] : []
    console.log('[BLESearch.js] - stopSearch',devices)

    if (!devices.length) {
      this.props.bleSearchStop()
      if(this.state.searchQuery.length != 0) {
        this.searchCount ++      
      }
      else {
        this.searchCount = 0
      }
      return
    }

    const { data } = await API.get('api/all/access-points').catch((err) => err.response);
    console.log('data: ', Object.keys(data.data));
    const currentUserAps = data.data.current_users_aps;
    const otherUsersAps = data.data.other_users_aps;
    // console.log('[BLESearch.js] - stopSearch currentUserAps: ', JSON.stringify(currentUserAps, null, 2));
    // console.log('[BLESearch.js] - stopSearch otherUserAps: ', JSON.stringify(otherUsersAps, null, 2));
    const currentUserMacs = currentUserAps.map(ap => ap.mac.toUpperCase());
    const otherUserMacs = otherUsersAps.map(ap => ap.mac.toUpperCase());

    // console.log('[BLESearch.js] - stopSearch currentUserMacs: ', currentUserMacs);
    // console.log('[BLESearch.js] - stopSearch otherUserMacs: ', otherUserMacs);

    const { networks } = this.props    

    const badNodes = devices.filter((device) => {
      if (this.selectDeviceName(device) === "MeshPP_SW_Error__BAD_MAC") return true
      return false
    });
    const newNodes = devices.filter(d => {
      const mac = this.getMacFromName(this.selectDeviceName(d))
      if (!mac) return false
      return !currentUserMacs.includes(mac) && !otherUserMacs.includes(mac)
    })
    const otherNodes = devices.filter(d => {
      const mac = this.getMacFromName(this.selectDeviceName(d))
      if (!mac) return false
      return otherUserMacs.includes(mac)
    })
    const enableExisted = devices.filter(d => {
      const mac = this.getMacFromName(this.selectDeviceName(d))
      if (!mac) return false
      return currentUserMacs.includes(mac)
    })

    const enableExistedMacs = enableExisted.map((x) => this.getMacFromName(x.advertising.localName))

    const filteredNetworks = await this.getFilteredNetworks(networks, enableExistedMacs)

    // console.log('[BLESearch.js] - stopSearch networks', networks)
    console.log('[BLESearch.js] - stopSearch enableExistedMacs', enableExistedMacs)
    console.log('[BLESearch.js] - stopSearch filteredNetworks ', filteredNetworks)
    
    console.log('[BLESearch.js] - stopSearch newNodes', newNodes)
    console.log('[BLESearch.js] - stopSearch otherNodes', otherNodes)
    console.log('[BLESearch.js] - stopSearch badNodes', badNodes)
    this.setState({
      devices,
      newNodes,
      otherNodes,
      filteredNetworks,
      badNodes,
      showNode: 'sort',
      badSearchQueryMask: false 
    })

    if(this.state.searchQuery.length != 0) {
      this.searchCount ++      
    }
    else {
      this.searchCount = 0
    }
    this.props.bleSearchStop()
  }

  forceNRFDisconnect() {
    if(this.props.device) BLEService.nrfDisconnectBle(this.props.device)
    this.setState({ bleForceDisconnect: true })
    this.nrfForceDisconnectTimeout = setTimeout(() => {
      console.log('[BLEService.js] - Force NRF Disconnect Timeout')
      this.disconnect()
      return
    }, FORCE_DISCONNECT_TIMEOUT_MS)
  }

  disconnect() {
    console.log('[BLESearch.js] - Disconnecting Device', this.props.device)
    if (this.props.device) {
      if (Platform.OS === 'android') {
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

  getMacFromName = (name) => {
    const macMatch = name.match(/([0-9A-F]{2}:?){6}/g)
    //console.log('[BLESearch.js] - getMacFromName: ', macMatch)
    return macMatch && macMatch.length ? macMatch[0] : ''
  }

  isNodeBelongsToUser = (device) => {
    const { nodesMacs = [] } = this.props
    const mac = this.getMacFromName(this.selectDeviceName(device))
    return mac && nodesMacs.includes(mac.toUpperCase())
  }

  isNodeNew = async (device) => {
    const { checkNodeByMac } = this.props
    console.log('[BLESearch.js] - isNodeNew: ', device)
    const mac = this.getMacFromName(this.selectDeviceName(device))
    const { data } = await checkNodeByMac(mac)
    return !data[mac] || false
  }

  newNodesByMac = async (macs) => {
    //console.log('[BLESearch.js] - newNodesByMac: ', macs, macs.length)
    if (!this.context.isConnected || !this.context.isInternetReachable || macs.length === 0) return {}
    const { checkNodeByMac } = this.props
    const { data } = await checkNodeByMac(macs)
    return data
  }

  addDevice = (device) => {
    this.deviceMap.set(device.id, device)
  }

  removeDevice = (device) => {
    this.map.delete(device.id)
  }

  log = (message) => {
    // console.log(`log message: ${message}\n${this.state.log}`)
    this.setState((prev) => ({ log: `${message}\n${prev.log}` }))
  }

  findDeviceByNodeMac = (mac) => {
    const { devices } = this.state
    return devices.find((device) => this.selectDeviceName(device).includes(mac.toUpperCase()))
  }

  connectToExistDevice = (node) => {
    console.log('[BLESearch.js] - connectToExistDevice node: ', node)
    const dev = this.findDeviceByNodeMac(node.mac)
    if (dev) this.connectToDevice(dev)
  }

  connectToDevice = async (device) => {
    console.log('[BLESearch.js] - Connecting Device', this.props.devi)
    this.searchCount = 0
    if (this.props.device) {
      this.forceNRFDisconnect()
      this.props.bleDeviceConnecting(device.id)
      this.deviceToConnect = device
    }
    else {
      this.props.bleDeviceConnecting(device.id)
      this.connectToDeviceWithoutRetry(device)
      .catch(() => {
        this.connectToDeviceWithoutRetry(device)
      })
      this.connectTimeout = setTimeout(() => {
        console.log('[BLEService.js] - Connecting Timeout')
        AlertHelper.alert('error', 'Error', 'Failure connecting to device, please retry')
        this.props.bleDeviceConnectTimeout()
        this.disconnect()
        return
      }, CONNECT_TIMEOUT_MS)
    }
  }

  sortDevice = async(device) => {
    console.log("[BLESearch.js] sortDevice device param: ", device)
    const { networks, nodesMacs } = this.props
    console.log('[BLESearch.js] sortDevice nodesMacs: ', nodesMacs);
    const { repeatCount } = this.state
    /* const adoptedNodes = devices.filter((device) => {
      const mac = this.getMacFromName(this.selectDeviceName(device))
      if (!mac) return false
      return nodesMacs.includes(mac.toUpperCase())
    })
    console.log('[BLESearch.js] - sortDevice adoptedNodes: ', adoptedNodes)
    const adoptedMacs = adoptedNodes.map((x) => this.getMacFromName(x.advertising.localName))

    const notAdopted = devices.filter((device) => {
      const mac = this.getMacFromName(this.selectDeviceName(device))
      if (!mac) return false
      return !adoptedMacs.includes(mac)
    })

    console.log('[BLESearch.js] - stopSearch notAdopted: ', notAdopted)
    const notAdoptedMacs = notAdopted.map((x) => this.getMacFromName(x.advertising.localName)) */
    

    const badNodes = this.selectDeviceName(device) === "MeshPP_SW_Error__BAD_MAC" ? [device]: []
    const notAdoptedMac = [this.getMacFromName(device.advertising.localName)]
    const nodesAdoptedStatus = await this.newNodesByMac(notAdoptedMac)

    console.log('[BLESearch.js] - nodesAdoptedStatus', nodesAdoptedStatus)
    const notAdopted = [device]

    const newNodes = await this.getNewNodes(notAdopted, nodesAdoptedStatus)

    const otherNodes = await this.getOtherNodes(notAdopted, nodesAdoptedStatus)

    const enableExisted = await this.getEnableExisted(notAdopted, nodesAdoptedStatus)

    const enableExistedMacs = enableExisted.map((x) => this.getMacFromName(x.advertising.localName))

    const filteredNetworks = await this.getFilteredNetworks(networks, enableExistedMacs)

    // console.log('[BLESearch.js] - sortDevice networks', networks)
    console.log('[BLESearch.js] - sortDevice enableExistedMacs', enableExistedMacs)
    console.log('[BLESearch.js] - sortDevice filteredNetworks ', filteredNetworks)
    
    console.log('[BLESearch.js] - sortDevice newNodes', newNodes)
    console.log('[BLESearch.js] - sortDevice otherNodes', otherNodes)
    console.log('[BLESearch.js] - sortDevice badNodes', badNodes)
    const devices = this.deviceMap.size ? [...this.deviceMap.values()] : []
    console.log('[BLESearch.js] - sortDevice devices: ',devices)
    this.setState({
      devices,
      newNodes,
      otherNodes,
      filteredNetworks,
      badNodes,
      showNode: 'sort',
      badSearchQueryMask: false 
    })
  }

  connectToDeviceWithoutRetry = (device) => {
    return new Promise((resolve, reject) => {
      BLEService.connectDevice(device.id)
        .then(() => {
          // Success code
          if (this.bleDisconnectListenerSet === false) {
            console.log('[BLESearch.js] - bleDisconnectListenerSet false')
            this.bleDisconnectListener = BLEService.bleManagerEmitter.addListener(
              'BleManagerDisconnectPeripheral',
              this.onDeviceDisconnect.bind(this),
            )
            this.bleDisconnectListenerSet = true
          }
          console.log('[BLESearch.js] - Device Connected: ', this.selectDeviceName(device), device.id)
          //BLEService.stopScan()
          //this.props.bleSearchStop()
          this.props.bleDeviceConnected(device)
          this.subscribeBLEServices().then(() => {
            console.log('[BLESearch.js] - connectToDevice: ', device)
            if(Platform.OS === 'android') {
              BLEService.requestConnectionPriority(device.id)
              .then(() => {
                console.log('[BLESearch.js] - requestConnectionPriority success: ', 1)
                BLEService.readBattery(this.props.device)
                  .then((readData) => {
                    console.log('[BLESearch.js] - readBattery Success', readData)
                    let batteryValue = `${readData}%`
                    this.props.bleBatteryUpdate(batteryValue)
                    console.log('[BLESearch.js] - batteryValue', this.props.batteryValue)
                    BLEService.checkEnabled(this.props.device)
                    resolve()
                  })
              })
            }
            else {
              BLEService.readBattery(this.props.device)
              .then((readData) => {
                console.log('[BLESearch.js] - readBattery Success', readData)
                let batteryValue = `${readData}%`
                this.props.bleBatteryUpdate(batteryValue)
                console.log('[BLESearch.js] - batteryValue', this.props.batteryValue)
                BLEService.checkEnabled(this.props.device)
                resolve()
              })
            }
            
          })
        })
        .catch((e) => {
          // Failure code
          console.log('[BLESearch.js] - Connecting Device error: ' + e)
          reject()
        })
    })
  }

  onServiceUpdate = ({ value, peripheral, characteristic, service }) => {
    console.log('[BLESearch.js] - onServiceUpdate', characteristic)
    if (
      characteristic === '6e400003-b5a3-f393-e0a9-e50e24dcca9e' ||
      characteristic === '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
    ) {
      console.log('[BLESearch.js] - BLE_UART_READ_UUID Update', value)
      const byteValue = base64ToBytes(value)
      if ([166, 161].includes(byteValue.readUInt8(0)) && [1, 3].includes(byteValue.readUInt8(1))) {
        let isLoadEnabled = !!byteValue.readUInt8(2)
        this.props.bleLoadEnabled(isLoadEnabled)
        this.props.bleDeviceReadyToEdit()
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
      console.log('[BLESearch.js] - BLE_BATTERY_UPATE_UUID Update', batteryValue)
      this.props.bleBatteryUpdate(batteryValue)
    }
  }

  onDeviceDisconnect() {
    console.log('[BLESearch.js] - onDeviceDisconnect', this.bleServiceUpdateListenerSet, this.bleDisconnectListenerSet)
    if (this.bleServiceUpdateListenerSet) {
      this.bleServiceUpdateListener.remove()
      this.bleServiceUpdateListenerSet = false
    }
    if (this.bleDisconnectListenerSet) {
      this.bleDisconnectListener.remove()
      this.bleDisconnectListenerSet = false
    }
    if(this.nrfForceDisconnectTimeout) clearTimeout(this.nrfForceDisconnectTimeout)
      // If the disconnection happened because of device side disconnect
    if(this.props.characteristics) {
      this.props.bleServiceUnsubscribed()
    }
    if(Platform.OS === 'android' && this.props.device) {
      BLEService.removePeripheral(this.props.device.id)
        .then(() => {
          console.log('[BLESearch.js] - Device peripheral remove success')
          
          BLEService.getConnectedPeripherals()
          .then((ret1) => {
            const conntedMeshPP1 = ret1.filter((node) => node?.id === this.props.device.id)
            if(conntedMeshPP1.length != 0) {
              console.log('[BLESearch.js] - peripheral still connected', conntedMeshPP1[0])
              this.setState({ bleForceDisconnect: false, badBLEDisconnect: true, badBLEDisconnectOverlayIsVisible: true })
              this.props.bleDeviceDisconnected()
              if(this.props.connecting) {
                this.connectToDevice(this.deviceToConnect)
              }
            }
            else {
              this.setState({ bleForceDisconnect: false })
              this.props.bleDeviceDisconnected()
              if(this.props.connecting) {
                this.connectToDevice(this.deviceToConnect)
              }
            }
          })
        })
        .catch(() => {
          console.log('[BLESearch.js] - Device peripheral remove fail')
          this.setState({ bleForceDisconnect: false })
          this.props.bleDeviceDisconnected()
          if(this.props.connecting) {
            this.connectToDevice(this.deviceToConnect)
          }
        })
    }
    else {
      this.setState({ bleForceDisconnect: false })
      this.props.bleDeviceDisconnected()
      if(this.props.connecting) {
        this.connectToDevice(this.deviceToConnect)
      }
    }
  }

  enableBluetooth = () => {
    if (Platform.OS === 'android') {
      BLEService.enableBluetooth()
        .then(() => {
          console.log('[BLESearch.js] - BLE is enabled')
        })
        .catch((error) => {
          console.log('[BLESearch.js] - BLE not enabled', error)
        })
    } else {
      Linking.openURL('App-Prefs:')
    }
  }

  openSettings = () => {
    openSettings().catch(() => console.warn('Cannot open settings'))
  }

  toggleDetails = (details) => {
    this.setState((prevState) => ({ details: prevState.details === details ? null : details }))
  }

  onPowerSwitch = () => {
    if (this.props.isLoadEnabled === true) {
      console.log('[BLESearch.js] - onPowerOff')
      BLEService.turnOffDevice(this.props.device)
      this.props.bleLoadEnabled(false)
    } else {
      console.log('[BLESearch.js] - onPowerOn')
      BLEService.turnOnDevice(this.props.device)
      this.props.bleLoadEnabled(true)
    }
  }

  openNodeManual = (node, network) => {
    const { navigation } = this.props
    BLEService.stopScan()
    this.goingToNodeManual = true
    navigation.navigate('NodeManual', {
      node,
      network,
      fromBLE: true,
    })
  }

  cancelRestartBluetooth = () => {
    this.searchCount = 2
    this.setState({ badBLEDisconnect: false, badBLEDisconnectOverlayIsVisible: false, badSearch: false,  badSearchQuery: false, badSearchQueryMask: true })
  }

  restartBluetooth = () => {
    this.setState({ bleRestartInProgress: true, badSearchQueryMask: true, badBLEDisconnect: false, badSearch: false, badSearchQuery: false })
    this.searchCount = 0
    BLEService.forceDisableBluetooth()
  }

  openOtherUserWarning = () => {
    this.setState({ otherUserWarningVisible: true })
  }

  closeOtherUserWarning = () => {
    this.setState({ otherUserWarningVisible: false })
  }

  renderPopup = () => {
    if(this.state.otherUserWarningVisible === true) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.state.otherUserWarningVisible}
              width={0.7}
              height={0.2}
              dialogAnimation={new ScaleAnimation()}
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="OK"
                    textStyle={styles.okButtonText}
                    onPress={() => this.closeOtherUserWarning()} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  This node belongs to another user's network. Please contact Mesh++ office to access it. 
                </Text>
              </DialogContent>
            </Dialog>
          )}
        </ManageThemeContext.Consumer>
      )
    }
    else if(this.state.badBLEDisconnect === true && this.state.bleRestartInProgress === false) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.state.badBLEDisconnectOverlayIsVisible}
              width={0.7}
              height={0.2}
              dialogAnimation={new ScaleAnimation()}
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="CANCEL"
                    textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                    onPress={() => this.cancelRestartBluetooth()} />
                  <DialogButton
                    text="OK"
                    textStyle={styles.okButtonText}
                    onPress={() => this.restartBluetooth()} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}} numberOfLines={1} adjustsFontSizeToFit>
                  Bluetooth Disconnection issue. 
                </Text>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Restart Bluetooth? 
                </Text>
              </DialogContent>
            </Dialog>
          )}
        </ManageThemeContext.Consumer>
      )
    }
    else if(this.state.badSearch === true) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.state.badBLEDisconnectOverlayIsVisible}
              width={0.7}
              height={0.2}
              dialogAnimation={new ScaleAnimation()}
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="CANCEL"
                    textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                    onPress={() => this.cancelRestartBluetooth()} />
                  <DialogButton
                    text="OK"
                    textStyle={styles.okButtonText}
                    onPress={() => this.restartBluetooth()} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}} numberOfLines={1} adjustsFontSizeToFit>
                  Unable to find the node.
                </Text>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Restart Bluetooth? 
                </Text>
              </DialogContent>
            </Dialog>
          )}
        </ManageThemeContext.Consumer>
      )
    }
    else if(this.state.badSearchQuery === true) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.state.badBLEDisconnectOverlayIsVisible}
              width={0.7}
              height={0.2}
              dialogAnimation={new ScaleAnimation()}
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="CANCEL"
                    textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                    onPress={() => this.cancelRestartBluetooth()} />
                  <DialogButton
                    text="OK"
                    textStyle={styles.okButtonText}
                    onPress={() => this.restartBluetooth()} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  No Bluetooth devices found.
                </Text>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Restart Bluetooth? 
                </Text>
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
                visible={this.state.badBLEDisconnectOverlayIsVisible}
                width={0.7}
                height={0.18}
                dialogAnimation={new ScaleAnimation()}
              >
                <DialogContent style={{ ...styles.popupDialogStyle, height: screenHeight * 0.18, backgroundColor: theme.primaryBackground }}>
                  <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                    Restarting Bluetooth...
                  </Text>
                </DialogContent>
              </Dialog>
            )}
          </ManageThemeContext.Consumer>
        )
    }
  }

  renderNode = (node, network) => {
    const { navigation, batteryValue, connecting, readyToEdit } = this.props
    const { details } = this.state
    const { isConnected } = this.context

    const device = this.findDeviceByNodeMac(node.mac)
    node.battery = (this.props.device && device.id === this.props.device.id) ? parseInt(batteryValue, 10) : 0

    return (
      <TouchableOpacity
        style={styles.nodeWrap}
        key={node.id}
        disabled={!!((this.props.device && device.id === this.props.device.id) || connecting)}
        onPress={() => {
          this.connectToExistDevice(node)
        }}>
        <UniversalItem
          type="node"
          item={node}
          connected={!connecting && this.props.device && device.id === this.props.device.id && readyToEdit}
          isShowSwitch={!connecting && this.props.device && device.id === this.props.device.id}
          isSwitchDisabled={false}
          isConnecting={connecting && connecting === device.id && !readyToEdit}
          value={this.props.device && device.id === this.props.device.id && this.props.isLoadEnabled}
          disabled={!this.props.device}
          onValueChange={this.onPowerSwitch.bind(this)}
          toggleDetails={() => this.toggleDetails(node.id)}
          details={details === node.id}
          link={
            this.props.device && this.props.device.id === device.id && readyToEdit ? () => this.openNodeManual(node, network) : null
          }
        />
      </TouchableOpacity>
    )
  }

  renderExist = (network) => {
    return (
      <View key={network.id}>
        <Text numberOfLines={1} style={styles.networkName}>
          {network.name}
        </Text>
        {network.nodes.map((device) => this.renderNode(device, network))}
      </View>
    )
  }

  renderNodeNew = (device) => {
    const { batteryValue, connecting, readyToEdit } = this.props
    const { isConnected } = this.context
    const connected = !connecting && this.props.device && device.id === this.props.device.id
    return (
      <ManageThemeContext.Consumer key={device.id}>
        {({ theme }) => (
          <TouchableOpacity
            style={[
              styles.node,
              { backgroundColor: theme.primaryCardBgr, borderColor: connected ? '#1F6BFF' : theme.primaryBorder },
            ]}
            key={device.id}
            disabled={!!((this.props.device && device.id === this.props.device.id) || connecting)}
            onPress={() => {
              this.connectToDevice(device)
            }}>
            <View style={styles.nodeInfoContainer}>
              <View style={styles.nodeTitleRow}>
                <Text style={{ ...styles.newNodeLocalName, color: theme.primaryText }}>{this.selectDeviceName(device)}</Text>
                <View style={styles.labelNew}>
                  <Text style={styles.labelText}>NEW</Text>
                </View>
              </View>
              <View style={styles.newNodeSwitchContainer}>
                {this.props.device && device.id === this.props.device.id && (
                  <Switch
                    style={styles.newNodeSwitch}
                    // ios_backgroundColor="#A3ACBA"
                    ios_backgroundColor="#E6ECF5"
                    thumbColor="#FFF"
                    trackColor={{
                      false: '#E6ECF5',
                      // false: '#A3ACBA',
                      true: '#1F6BFF',
                    }}
                    disabled={!this.props.device}
                    onValueChange={this.onPowerSwitch.bind(this)}
                    value={this.props.isLoadEnabled}
                  />
                )}
              </View>
              {connecting && connecting === device.id ? (
                <View style={styles.connectingStyle}>
                  <ActivityIndicator size="large" />
                </View>
              ) : this.props.device && device.id === this.props.device.id && readyToEdit ? (
                <>
                  <View style={styles.nodeInfoRow}>
                    <Battery percent={parseInt(batteryValue, 10)} />
                    <Text style={styles.nodeInfoText}>
                      {batteryValue}
                      {` (${getDischargeEstim(
                        parseInt(batteryValue, 10) > 4 ? 45 * 60 * (parseInt(batteryValue, 10) - 4) : 0,
                      )})`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => {
                      const macMatch = this.selectDeviceName(this.props.device).match(/([0-9A-F]{2}:?){6}/g)
                      const mac = macMatch && macMatch.length ? macMatch[0] : ''
                      if (!mac) {
                        alert('Node MAC address not found.\nPlease try another Node')
                        return
                      }
                      this.goingToNodeManual = true
                      this.props.navigation.navigate('NodeManual', {
                        qr: { name: this.selectDeviceName(device), mac },
                        mode: 'create',
                        fromBLE: true,
                      })
                    }}>
                    <Text style={{ fontSize: 16, color: '#FFF' }}>Setup this Node</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderFoundNode = (device) => {
    const { connecting } = this.props
    const connected = !connecting && this.props.device && device.id === this.props.device.id
    const { selectedNodes } = this.state;
    return (
      <ManageThemeContext.Consumer key={device.id}>
        {({ theme }) => (
          <TouchableOpacity
            style={[
              styles.node,
              { backgroundColor: theme.primaryCardBgr, borderColor: connected ? '#1F6BFF' : theme.primaryBorder },
            ]}
            key={device.id}
            disabled={!!((this.props.device && device.id === this.props.device.id) || connecting)}
            onPress={() => {
              this.sortDevice(device)
            }}>
            <View style={styles.nodeInfoContainer}>
              <View style={styles.nodeTitleRow}>
                <BouncyCheckbox 
                  fillColor="#1F6BFF" 
                  unfillColor="#fff"
                  onPress={(isChecked) => {}} 
                />
                <Text style={{ ...styles.newNodeLocalName, color: theme.primaryText }}>{this.selectDeviceName(device)}</Text>
                <TouchableOpacity style={styles.setupButton2} onPress={() => this.sortDevice(device)}>
                    <Text style={{color: '#fff', fontSize: 16}}>Setup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderNodeOther = (device) => {
    return (
      <ManageThemeContext.Consumer key={device.id}>
        {({ theme }) => (
          <TouchableOpacity
            style={[styles.nodeOther, { backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }]}
            key={device.id}
            disabled={false}
            onPress={() => {
              this.openOtherUserWarning()
            }}>
            <View style={styles.nodeInfoContainer}>
              <View style={styles.nodeOtherTitleRow}>
                <Text style={{ ...styles.newNodeLocalName, color: theme.primaryText }}>{this.selectDeviceName(device)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderNodeOtherTitle = () => {
    return (
      <Text numberOfLines={1} style={styles.OtherNodeName}>
        Other Networks
      </Text>
    )
  }

  renderNodeOtherBottom = () => {
    return (
      <Text numberOfLines={1} style={styles.OtherNodeNameBottom}>
      </Text>
    )
  }

  renderNodeError = (device) => {
    const { batteryValue, connecting, readyToEdit } = this.props
    const { isConnected } = this.context
    const connected = !connecting && this.props.device && device.id === this.props.device.id
    return (
      <ManageThemeContext.Consumer key={device.id}>
        {({ theme }) => (
          <TouchableOpacity
            style={[
              styles.node,
              { backgroundColor: theme.primaryCardBgr, borderColor: connected ? '#1F6BFF' : theme.primaryBorder },
            ]}
            key={device.id}
            disabled={!!((this.props.device && device.id === this.props.device.id) || connecting)}
            onPress={() => {
              this.connectToDevice(device)
            }}>
            <View style={styles.nodeInfoContainer}>
              <View style={styles.nodeTitleRow}>
                <Text style={{ ...styles.newNodeLocalName, color: theme.primaryText }}>{this.selectDeviceName(device)}</Text>
                <View style={styles.labelBad}>
                  <Text style={styles.labelText}>ERR</Text>
                </View>
              </View>
              <View style={styles.newNodeSwitchContainer}>
                {this.props.device && device.id === this.props.device.id && (
                  <Switch
                    style={styles.newNodeSwitch}
                    // ios_backgroundColor="#A3ACBA"
                    ios_backgroundColor="#E6ECF5"
                    thumbColor="#FFF"
                    trackColor={{
                      false: '#E6ECF5',
                      // false: '#A3ACBA',
                      true: '#1F6BFF',
                    }}
                    disabled={!this.props.device}
                    onValueChange={this.onPowerSwitch.bind(this)}
                    value={this.props.isLoadEnabled}
                  />
                )}
              </View>
              {connecting && connecting === device.id ? (
                <View style={styles.connectingStyle}>
                  <ActivityIndicator size="large" />
                </View>
              ) : this.props.device && device.id === this.props.device.id && readyToEdit ? (
                <>
                  <View style={styles.nodeInfoRow}>
                    <Battery percent={parseInt(batteryValue, 10)} />
                    <Text style={styles.nodeInfoText}>
                      {batteryValue}
                      {` (${getDischargeEstim(
                        parseInt(batteryValue, 10) > 4 ? 45 * 60 * (parseInt(batteryValue, 10) - 4) : 0,
                      )})`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => {
                      const macMatch = this.selectDeviceName(this.props.device).match(/([0-9A-F]{2}:?){6}/g)
                      const mac = macMatch && macMatch.length ? macMatch[0] : ''
                      this.goingToNodeManual = true
                      this.props.navigation.navigate('NodeManual', {
                        qr: { name: 'MeshPP_20:CE:2A:BA:DM:AC', mac: '20:CE:2A:BA:DM:AC' },
                        mode: 'badNode',
                        fromBLE: true,
                      })
                    }}>
                    <Text style={{ fontSize: 16, color: '#FFF' }}>Recover this Node</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  handleChangeSearchQuery = (text) => {
    const r = /([a-z0-9]{2})([a-z0-9]{2})/i
    let str = text.replace(/[^a-z0-9]/gi, '')
    while (r.test(str)) {
      str = str.replace(r, '$1' + ':' + '$2')
    }
    if(this.state.searchQuery.length > text.length) {
      this.searchCount = 0
    }
    this.setState({ searchQuery: str, badSearchQueryMask: false })
  }

  getFilteredNewNodes = () => {
    const { newNodes, searchQuery } = this.state
    return newNodes.filter((node) => node?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()))
  }

  getFilteredOtherNodes = () => {
    const { otherNodes, searchQuery } = this.state
    return otherNodes.filter((node) => node?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()))
  }

  getFilteredMyNodesInNetworks = () => {
    //console.log('[BLESearch.js] - getFilteredMyNodesInNetworks', this.state.filteredNetworks)
    const { filteredNetworks, searchQuery } = this.state
    // create array for new filtered networks
    const fns = []
    for (let i = 0; i < filteredNetworks.length; i += 1) {
      // reference to the current network
      const network = filteredNetworks[i]
      // create new network object with filtered nodes
      const fn = {
        ...network,
        nodes: network.nodes.filter((node) => node?.mac?.toLowerCase().includes(searchQuery.trim().toLowerCase())),
      }
      // if we have at least one node inside network that sutisfies filter -> push it into new filtered networks array
      if (fn.nodes?.length) {
        fns.push(fn)
      }
    }

    // return new filtered networks array
    return fns
  }

  render() {
    const { isSearching, 
      searchError, 
      connecting, 
      readyToEdit, 
      loadingCounter, 
      maxNum 
    } = this.props
    const { 
      isBluetoothEnabled, 
      searchQuery, 
      badNodes, 
      bleForceDisconnect, 
      otherNodes,
      selectedNodes
    } = this.state
    const { isConnected } = this.context

    const filteredNewNodes = this.getFilteredNewNodes()
    const filteredOhterNodes = this.getFilteredOtherNodes()
    const myFilteredNetworks = this.getFilteredMyNodesInNetworks()

    if(Platform.OS === 'android' && searchQuery.length != 0 && 
       this.searchCount === 3 && 
       filteredNewNodes.length === 0 && myFilteredNetworks.length === 0 && this.state.badBLEDisconnectOverlayIsVisible === false && isSearching === false) {
      console.log('[BLESearch.js] - filteredNewNodes is empty')
      setTimeout(() => {
        this.setState({ badSearchQuery: true, badBLEDisconnectOverlayIsVisible: true })
      }, 400)
    }

    if(maxNum <= 0 || loadingCounter <= 0) {
      if (this.intervalId) clearTimeout(this.intervalId)
      if (this.intervalId2) clearTimeout(this.intervalId2)
    }

    const progressBar = Number((this.state.progressPer/100).toFixed(2))
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            {this.renderPopup()}
            <View>
              {this.props.route.routeName != 'BLESearchOffline' ? (
                <StackHeader
                  title="Nodes Nearby"
                  buttonText={isSearching ? 'Searching' : bleForceDisconnect ? 'Disconnecting' : readyToEdit ? 'Disconnect' :  (this.props.device || connecting) ? 'Connecting': 'Repeat'}
                  showButton={isBluetoothEnabled}
                  onPress={
                    isSearching
                      ? null
                      : bleForceDisconnect
                      ? null
                      : readyToEdit
                      ? this.forceNRFDisconnect.bind(this)
                      : this.props.device || connecting
                      ? null
                      : this.startFreshScan
                  }
                />
              ) : (
                <StackHeader
                  title="Offline Search"
                  buttonText={isSearching ? 'Searching' : bleForceDisconnect ? 'Disconnecting' : readyToEdit ? 'Disconnect' :  (this.props.device || connecting) ? 'Connecting': 'Repeat'}
                  showButton={isBluetoothEnabled}
                  onPress={
                    isSearching
                      ? null
                      : bleForceDisconnect
                      ? null
                      : readyToEdit
                      ? this.forceNRFDisconnect.bind(this)
                      : this.props.device || connecting
                      ? null
                      : this.startFreshScan
                  }
                />
              )}
              
              {maxNum > 0 && loadingCounter > 0 && this.props.route.routeName != 'BLESearchOffline' ? (
                <View>
                  <View style={styles.progressWrap}>
                    <Text style={{ ...styles.progressTextStyle, color: theme.primaryText }}>
                      {TEXTS[this.state.progressIndex % 3]}
                    </Text>
                    <View style={{alignItems: 'center',flexDirection: 'row'}}>
                      <Progress.Bar progress={progressBar} width={150} />  
                      <Text style={{ ...styles.progressTextStyle, color: theme.primaryText }}>
                        {"  "}{this.state.progressPer}%
                      </Text>
                    </View>
                  </View>
                  <Text style={{ ...styles.progressInfoTextStyle, color: theme.primaryText }} numberOfLines={1} adjustsFontSizeToFit>
                    {'Nodes in networks will not show up during loading'}
                  </Text>
                </View>
              ) : null}
              {isBluetoothEnabled && (
                <FieldBG
                  placeholder="Enter node name"
                  clearButtonMode="always"
                  value={searchQuery}
                  onChangeText={this.handleChangeSearchQuery}
                />
              )}
            </View>

            
            {isBluetoothEnabled ? (
              <View style={styles.contentContainer}>
                {(filteredNewNodes && filteredNewNodes.length) || 
                  (myFilteredNetworks && myFilteredNetworks.length) || 
                  (otherNodes && otherNodes.length) ||
                  (badNodes && badNodes.length) ? (
                  <ScrollView style={styles.scrollContainer}>
                    {filteredNewNodes && filteredNewNodes.length ? (
                      filteredNewNodes.map((element) => (
                        this.renderNodeNew(element)
                      ))
                    ) : null}
                    {myFilteredNetworks && myFilteredNetworks.length ? (
                      myFilteredNetworks.map((element) => (
                        this.renderExist(element)))
                    ) : null}
                    {badNodes && badNodes.length ? (
                      badNodes.map((element) => (
                        this.renderNodeError(element)))
                    ) : null}
                    {filteredOhterNodes && filteredOhterNodes.length ? (
                      this.renderNodeOtherTitle()
                    ) : null}
                    {filteredOhterNodes && filteredOhterNodes.length ? (
                      filteredOhterNodes.map((element) => (
                        this.renderNodeOther(element)))
                    ) : null}
                    {filteredOhterNodes && filteredOhterNodes.length ? (
                      this.renderNodeOtherBottom()
                    ) : null}
                  </ScrollView>
                ) : isSearching ? (
                  <LottieView source={require('../constants/animationBLE.json')} autoPlay loop />
                ) : (
                  <View style={styles.nodeWireframe}>
                    <NodeWireframe />
                    {searchError ? (
                      <Text style={{ ...styles.infoText, color: theme.primaryText }}>
                        {`In Android, the Location service must be working properly for Bluetooth scanning. 
                        \nIn the Mesh++ settings menu, please enter: Permissions -> Location Turn it OFF and back ON. 
                        \nYour device will be able to search properly.`}
                      </Text>
                    ) : (
                      <Text style={{ ...styles.infoText, color: theme.primaryText }}>
                        We haven’t found any Nodes nearby
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <>
                <View style={[styles.nodeWireframe, { marginTop: 80 }]}>
                  <BluetoothNotWorking />
                  <Text style={{ ...styles.infoText, color: theme.primaryText }}>Bluetooth is disabled</Text>
                </View>
                <View style={styles.button}>
                  <Button
                    text={Platform.OS === 'android' ? 'Enable Bluetooth' : 'Go to Bluetooth settings'}
                    onPress={this.enableBluetooth}
                  />
                </View>
              </>
            )}

            {!isSearching && searchError && (
              <View style={styles.button}>
                <Button text="Open Settings" onPress={this.openSettings} />
              </View>
            )}
            

            {!isConnected && (
              <View style={[styles.button, { ...styles.networkModeButton, backgroundColor: theme.primaryButtonGray }]}>
                <Text style={{ fontSize: 16, color: 'red' }}>Please connect to the network</Text>
              </View>
            )}
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    height: '82%',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },
  networkName: {
    marginTop: 8,
    marginHorizontal: 10,
    padding: 8,
    fontSize: 16,
    color: '#666F7A',
  },
  OtherNodeName: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 10,
    padding: 8,
    fontSize: 16,
    color: '#666F7A',
  },
  OtherNodeNameBottom: {
    marginTop: 2,
    marginBottom: 2,
    padding: 4,
    fontSize: 4,
  },
  connected: {
    borderColor: '#1F6BFF',
  },
  node: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    marginTop: 5, 
    marginBottom: 5,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nodeOther: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6
  },
  nodeWrap: {
    marginHorizontal: 10,
    marginBottom: 5,
    marginTop: 5, 
  },
  nodeInfoContainer: {
    width: '99%',
    justifyContent: 'center',
  },
  nodeTitleRow: {
    flexDirection: 'row',
    marginLeft: 16,
    marginVertical: 16,
    height: 30,
    alignItems: 'center',
    flex: 4,
  },
  nodeOtherTitleRow: {
    flexDirection: 'row',
    marginLeft: 16,
    marginVertical: 3,
    height: 30,
    alignItems: 'center',
    flex: 4,
  },
  nodeInfoText: {
    fontSize: 13,
    color: '#6D727A',
    marginLeft: 4,
  },
  nodeVersionInfoText: {
    fontSize: 13,
    color: '#4f5256',
    fontWeight: '500',
    marginLeft: 4,
  },
  nodeBadVersionInfoText: {
    fontSize: 13,
    color: '#f44336',
    fontWeight: '500',
    marginLeft: 4,
  },
  labelNew: {
    backgroundColor: '#00B860',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginHorizontal: 6,
  },
  labelBad: {
    backgroundColor: '#f44336',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginHorizontal: 6,
  },
  labelText: {
    color: '#FFF',
  },
  nodeWireframe: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  infoText: {
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
    fontSize: 16,
  },
  nodeInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  connectingStyle: {
    justifyContent: 'center',
    position: 'absolute',
    top: 14,
    right: 16,
  },
  setupButton: {
    width: '90%',
    backgroundColor: '#1F6BFF',
    marginVertical: 8,
    marginBottom: 16,
    paddingVertical: 16,
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  setupButton2: {
    width: '20%',
    backgroundColor: '#1F6BFF',
    marginLeft: 10,
    // marginVertical: 8,
    // marginBottom: 16,
    paddingVertical: 5,
    // alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  networkModeButton: {
    bottom: '5%',
    height: 48,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E6EEFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'center',
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
  },
  newNodeLocalName: { fontWeight: 'bold' },
  newNodeSwitchContainer: {
    position: 'absolute',
    right: 8,
    top: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  newNodeSwitch: {
    shadowColor: '#AAA',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },

  popupDialogStyle: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },

  popupTextStyle: {
    textAlign: 'center',
    fontSize: 18,
    color: '#191919',
    marginHorizontal: 10,
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

  progressWrap: {
    width: '100%',
    margin: 7,
    paddingRight: 20,
    paddingLeft: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressTextStyle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  progressInfoTextStyle: {
    fontSize: 15,
    textAlign: 'center',
  },
})

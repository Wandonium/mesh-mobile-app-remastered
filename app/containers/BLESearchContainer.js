import { connect } from 'react-redux'
import { BLESearch } from '../screens'

import { 
  checkNodeByMac,
  bleInit,
  bleSearchStart,
  bleSearchStop,
  bleSearchError,
  bleDeviceDiscovered,
  bleDeviceConnecting,
  bleDeviceConnected,
  bleDeviceConnectTimeout,
  bleDeviceReadyToEdit,
  bleDeviceDisconnected,
  bleCharacteristicsDiscovered,
  bleServiceSubscribed,
  bleServiceUnsubscribed,
  bleBatteryUpdate,
  bleLoadEnabled,
  // getAccessPoints,
  inBLESearchScreen,
  outBLESearchScreen,
  setLoadingProgress
} from '../actions'

const mstp = ({ networks, ble, loading }) => {
  // debugger
  const nodesArray = networks.networks.length && networks.entities.aps ? Object.values(networks.entities.aps) : []
  const nodesMacsArray = nodesArray.length ? nodesArray.map(x => x.mac.toUpperCase()) : []

  const isSearching = ble.isSearching
  const searchError = ble.searchError
  const connecting = ble.connecting
  const readyToEdit = ble.readyToEdit
  const device = ble.connected
  const characteristics = ble.sub_characteristics
  const isLoadEnabled = ble.isLoadEnabled
  const batteryValue = ble.batteryValue
  // const currentUserAps = ble.currentUserAps;
  // const otherUsersAps = ble.otherUsersAps;

  return {
    networks: networks.networks,
    nodes: nodesArray,
    nodesMacs: nodesMacsArray,
    isSearching: isSearching,
    searchError: searchError,
    connecting: connecting,
    readyToEdit: readyToEdit,
    device: device,
    characteristics: characteristics,
    isLoadEnabled: isLoadEnabled,
    batteryValue: batteryValue,
    // currentUserAps,
    // otherUsersAps,
    loadingCounter: loading.loadingCounter,
    maxNum: loading.maxNum, 
    loadingProgress: loading.loadingProgress
  }
}

const mdtp = {
  checkNodeByMac,
  checkNodeByMac,
  bleInit,
  bleSearchStart,
  bleSearchStop,
  bleSearchError,
  bleDeviceDiscovered,
  bleDeviceConnecting,
  bleDeviceConnected,
  bleDeviceConnectTimeout,
  bleDeviceReadyToEdit,
  bleDeviceDisconnected,
  bleCharacteristicsDiscovered,
  bleServiceSubscribed,
  bleServiceUnsubscribed,
  bleBatteryUpdate,
  bleLoadEnabled,
  // getAccessPoints,
  inBLESearchScreen,
  outBLESearchScreen,
  setLoadingProgress
}

export default connect(mstp, mdtp)(BLESearch)

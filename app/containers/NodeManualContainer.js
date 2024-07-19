import { connect } from 'react-redux'
import {
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
  createNode,
  editNode,
  rebootNode,
} from '../actions'
import { NodeManual } from '../screens'

const mstp = ({ ble }) => {
  const isSearching = ble.isSearching
  const searchError = ble.searchError
  const connecting = ble.connecting
  const readyToEdit = ble.readyToEdit
  const device = ble.connected
  const characteristics = ble.sub_characteristics
  const isLoadEnabled = ble.isLoadEnabled
  const batteryValue = ble.batteryValue

  return {
    isSearching: isSearching,
    searchError: searchError,
    connecting: connecting,
    readyToEdit: readyToEdit,
    device: device,
    characteristics: characteristics,
    isLoadEnabled: isLoadEnabled,
    batteryValue: batteryValue
  }
}

const mdtp = {
  createNode,
  editNode,
  rebootNode,
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
}

export default connect(mstp, mdtp)(NodeManual)

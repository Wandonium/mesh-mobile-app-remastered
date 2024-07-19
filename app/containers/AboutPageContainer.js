import { connect } from 'react-redux'
import { AboutPage } from '../screens'
import {
  bleBatteryUpdate,
  bleSearchStart,
  bleSearchStop,
  bleSearchError,
  bleDeviceConnecting,
  bleDeviceConnected,
  bleCharacteristicsDiscovered,
  bleServiceSubscribed,
  bleServiceUnsubscribed,
  bleDeviceDisconnected,

  bleDormantEnabled,
  bleSystemReset,

  dfuSubscribe,
  dfuUnsubscribe,
  checkFirmware, 
  checkFirmwareFinished, 
  checkFirmwareFail, 
  checkFirmwareSuccess,
  selectBattery0v4,
  dfuError,
  dfuInit, 
  dfuPercent, 
  dfuUpdated, 
  dfuUpdating,
  downloadFirmware,
  downloadFirmwareFail,
  downloadFirmwareSuccess, 
  downloadPercent,
  dfuApplyUpdate
} from '../actions'

const mstp = ({ ble, bleDfu }) => {
  const device = ble.connected
  const characteristics = ble.sub_characteristics
  const isDormantEnabled = ble.isDormantEnabled
  const isSystemReset = ble.isSystemReset
  const dfuBleMask = bleDfu.dfuBleMask
  return {
    device: device,
    characteristics: characteristics,
    isDormantEnabled: isDormantEnabled,
    isSystemReset: isSystemReset,
    dfuBleMask: dfuBleMask,
  };
}

const mdtp = {
  bleBatteryUpdate,
  bleSearchStart,
  bleSearchStop,
  bleSearchError,
  bleDeviceConnecting,
  bleDeviceConnected,
  bleCharacteristicsDiscovered,
  bleServiceSubscribed,
  bleServiceUnsubscribed,
  bleDeviceDisconnected,

  bleDormantEnabled,
  bleSystemReset,

  dfuApplyUpdate,
  downloadFirmware,
  downloadFirmwareSuccess,
  downloadFirmwareFail,
  downloadPercent,
  dfuInit,
  dfuUpdating,
  dfuUpdated,
  dfuError,
  dfuPercent,
  checkFirmware,
  checkFirmwareFinished,
  checkFirmwareSuccess,
  selectBattery0v4,
  checkFirmwareFail,
  dfuSubscribe,
  dfuUnsubscribe
}

export default connect(mstp, mdtp)(AboutPage)

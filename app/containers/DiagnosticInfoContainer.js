import { connect } from 'react-redux'
import { DiagnosticInfo } from '../screens'
import { bleBatteryUpdate, bleDeviceDisconnected } from '../actions'

const mstp = ({ ble }) => {
  const device = ble.connected
  return {
    device: device
  };
}

const mdtp = {
  bleBatteryUpdate,
  bleDeviceDisconnected
}

export default connect(mstp, mdtp)(DiagnosticInfo)
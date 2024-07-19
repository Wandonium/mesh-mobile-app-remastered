import { connect } from 'react-redux'
import { CreateSSID } from '../components'

import { createSSID, editSSID, deleteSSID, getSSID } from '../actions'

const mstp = ({ networks, captivePortals, SSID }, { navigation, route, top }) => {
  return {
    captivePortals: captivePortals.data,
    SSID,
    network: networks.networks.find(({ id }) => route.params.networkId === id),
  }
}

const mdtp = {
  createSSID,
  editSSID,
  deleteSSID,
  getSSID,
}

export default connect(mstp, mdtp)(CreateSSID)

import { connect } from 'react-redux'
import { CreateNodeQR } from '../screens'

import { createSSID, editSSID, deleteSSID } from '../actions'

const mstp = ({ networks }, { navigation, route, SSID }) => ({
  SSID,
  network: networks.networks.find(({ id }) => route.params.networkId === id),
})

const mdtp = {
  createSSID,
  editSSID,
  deleteSSID,
}

export default connect(mstp, mdtp)(CreateNodeQR)

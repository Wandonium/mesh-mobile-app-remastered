import { connect } from 'react-redux'
import { SSIDList } from '../screens'

import { deleteSSID } from '../actions'

const mstp = ({ networks }, { route }) => ({
  network: networks.networks.find(({ id }) => route.params?.networkId === id),
})

const mdtp = {
  deleteSSID,
}

export default connect(mstp, mdtp)(SSIDList)

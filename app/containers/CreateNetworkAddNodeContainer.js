import { connect } from 'react-redux'
import { CreateNetworkAddNode } from '../screens'

import { editNode, deleteNode } from '../actions'

const mstp = ({ networks }, { route }) => ({
  network: networks.networks.find(({ id }) => route.params?.networkId === id),
  prevNetworkNode: networks.prevNetworkNode,
})


const mdtp = {
  editNode,
  deleteNode,
}

export default connect(mstp, mdtp)(CreateNetworkAddNode)

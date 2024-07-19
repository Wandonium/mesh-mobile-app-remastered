import { connect } from 'react-redux'
import { ChannelScan } from '../components'

import { editNetwork, channelScan } from '../actions'

const mstp = ({ networks }, { navigation, route, networkId }) => {
  const network = networks.networks.find(({ id }) => route.params.networkId === id)
  return {
    networkId,
    network,
    nodes: network.aps,
  }
}

const mdtp = {
  editNetwork,
  channelScan,
}

export default connect(mstp, mdtp)(ChannelScan)

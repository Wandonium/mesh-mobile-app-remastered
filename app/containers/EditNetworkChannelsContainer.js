import { connect } from 'react-redux'
import { EditNetworkChannels } from '../components'

import { editNetwork, channelScan } from '../actions'

const mstp = ({ networks }, { navigation, route }) => ({
  network: networks.networks.find(({ id }) => route.params.networkId === id),
})

const mdtp = {
  editNetwork,
  channelScan,
}

export default connect(mstp, mdtp)(EditNetworkChannels)

import { connect } from 'react-redux'
import { AllNetworks } from '../screens'

import { editNetwork, deleteNetwork, unsubscribeFromNetwork } from '../actions'

const mstp = ({ networks }) => ({
  networks: networks.networks,
})

const mdtp = {
  editNetwork,
  deleteNetwork,
  unsubscribeFromNetwork,
}

export default connect(mstp, mdtp)(AllNetworks)

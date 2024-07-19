import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { CreateNodeDone } from '../screens'
import {
  refreshOneNetwork,
} from '../actions'

const getNetworkItems = (state) => state.networks
const getNetwork = (itemId, { networks }) => {
  return networks.find(({ id }) => id === itemId) || null
}

const findNetwork = () =>
  createSelector((state, props) => props.route.params?.networkId, getNetworkItems, getNetwork)

const mapState = () => {
  const getCurrentNetwork = findNetwork()

  return (state, ownProps) => {
    const network = getCurrentNetwork(state, ownProps)

    return {
      network,
    }
  }
}

const mdtp = {
  refreshOneNetwork,
}
export default connect(mapState, mdtp)(CreateNodeDone)

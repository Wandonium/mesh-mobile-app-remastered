import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { Network } from '../screens'

import {
  editNetwork,
  deleteNetwork,
  deleteNode,
  rebootNode,
  getNetworkHistory,
  unsubscribeFromNetwork,
  getNetworkStatistic,
  getNetworkWithNodes,
  setRequestTimeRangeInterval,
  refreshOneNetwork,
} from '../actions'

const getNetworkItems = (state) => state.networks
const getNodeItems = (state) => state.networks.entities.aps || []
const getStatistic = (state) => state.networks.networkStatistic

const getNetwork = (itemId, { networks }) => {
  return networks.find(({ id }) => id === itemId) || null
}

const findNetwork = () =>
  createSelector((state, props) => props.route.params?.networkId, getNetworkItems, getNetwork)

const mapState = () => {
  const getCurrentNetwork = findNetwork()

  return (state, ownProps) => {
    const { selectedPeriod } = state.networks
    const network = getCurrentNetwork(state, ownProps)
    const networkStatistic = getStatistic(state)
    const nodes = network?.aps?.length ? network.aps : []
    const nodeEntities = getNodeItems(state)
    const isManager = state.user.data.role === 'MANAGER'
    const isAdmin = ['SUPER_ADMIN', 'OWNER'].includes(state.user.data.data.role) || network.role === 'OWNER'
    const canShare = ['SUPER_ADMIN', 'OWNER'].includes(state.user.data.data.role) || isAdmin

    return {
      network,
      networkStatistic,
      nodes,
      nodeEntities,
      isAdmin,
      isManager,
      canShare,
      selectedPeriod,
    }
  }
}

const mdtp = {
  editNetwork,
  deleteNetwork,
  deleteNode,
  rebootNode,
  getNetworkHistory,
  getNetworkStatistic,
  setRequestTimeRangeInterval,
  getNetworkWithNodes,
  unsubscribeFromNetwork,
  refreshOneNetwork,
}

export default connect(mapState, mdtp)(Network)

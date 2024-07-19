import { connect } from 'react-redux'
import { Dashboard } from '../screens'

import { editNetwork, deleteNetwork, unsubscribeFromNetwork, createNode, refreshNetwork, setLoadingProgress } from '../actions'

const mstp = ({ networks, loading }) => {
  // const networksArray = networks.result.map(id => networks.entities.networks[id])
  return {
    data: networks,
    networks: networks.networks,
    loadingCounter: loading.loadingCounter,
    maxNum: loading.maxNum,
    loadingProgress: loading.loadingProgress
  }
}

const mdtp = {
  editNetwork,
  deleteNetwork,
  unsubscribeFromNetwork,
  createNode,
  refreshNetwork,
  setLoadingProgress
}

export default connect(mstp, mdtp)(Dashboard)

import { connect } from 'react-redux'
import { CreateNetworkDone } from '../screens'

const mstp = ({ networks }, { route }) => ({
  network: networks.networks.find(({ id }) => route.params?.networkId === id),
})


export default connect(mstp)(CreateNetworkDone)

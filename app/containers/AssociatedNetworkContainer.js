import { connect } from 'react-redux'
import { AssociatedNetwork } from '../screens'

const mstp = ({ networks }) => ({
  networks: networks.networks.filter(item => item.role === 'OWNER'),
})

const mdtp = null

export default connect(mstp, mdtp)(AssociatedNetwork)

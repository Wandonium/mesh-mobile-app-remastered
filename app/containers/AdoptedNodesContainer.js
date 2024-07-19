import { connect } from 'react-redux'
import { AdoptedNodes } from '../screens'

import { editNode, reassignNodes } from '../actions'

const mstp = ({ networks }) => ({
  networks: networks.networks.filter(item => item.role === 'OWNER'),
})

const mdtp = {
  editNode,
  reassignNodes,
}

export default connect(mstp, mdtp)(AdoptedNodes)

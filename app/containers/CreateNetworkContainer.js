import { connect } from 'react-redux'
import { CreateNetwork } from '../screens'

import { createNetwork } from '../actions'

const mdtp = {
  createNetwork,
}

export default connect(null, mdtp)(CreateNetwork)

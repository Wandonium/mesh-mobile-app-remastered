import { connect } from 'react-redux'
import { Registration } from '../screens'

import { register } from '../actions'

const mdtp = {
  register,
}

export default connect(null, mdtp)(Registration)

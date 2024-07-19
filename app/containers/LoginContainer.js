import { connect } from 'react-redux'
import { Login } from '../screens'

import { login } from '../actions'

const mdtp = {
  login,
}

export default connect(null, mdtp)(Login)

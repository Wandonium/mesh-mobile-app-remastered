import { connect } from 'react-redux'
import { RegistrationConfirm } from '../screens'

import { registerConfirm } from '../actions'

const mdtp = {
  registerConfirm,
}

export default connect(null, mdtp)(RegistrationConfirm)

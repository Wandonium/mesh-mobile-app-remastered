import { connect } from 'react-redux'
import { RecoveryPasswordConfirm } from '../screens'

import { confirmRecoveryPassword } from '../actions'

const mdtp = {
  confirmRecoveryPassword,
}

export default connect(null, mdtp)(RecoveryPasswordConfirm)

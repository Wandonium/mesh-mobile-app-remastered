import { connect } from 'react-redux'
import { RecoveryPassword } from '../screens'

import { recoveryPassword } from '../actions'

const mdtp = {
  recoveryPassword,
}

export default connect(null, mdtp)(RecoveryPassword)

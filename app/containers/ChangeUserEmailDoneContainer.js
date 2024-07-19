import { connect } from 'react-redux'
import { ChangeUserEmailDone } from '../screens'

import { sendEmailCode } from '../actions'

const mdtp = {
  sendEmailCode,
}

export default connect(null, mdtp)(ChangeUserEmailDone)

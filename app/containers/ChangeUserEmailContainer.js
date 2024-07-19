import { connect } from 'react-redux'
import { ChangeUserEmail } from '../screens'

import { changeEmail } from '../actions'

const mdtp = {
  changeEmail,
}

export default connect(null, mdtp)(ChangeUserEmail);

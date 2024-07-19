import { connect } from 'react-redux';
import { ChangeUserPassword } from '../screens';

import { changePassword } from '../actions'

const mdtp = {
  changePassword,
}

export default connect(null, mdtp)(ChangeUserPassword);

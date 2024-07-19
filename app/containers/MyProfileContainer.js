import { connect } from 'react-redux'
import { MyProfile } from '../screens'

import { logout, changeUserData } from '../actions'

const mstp = ({ user }) => ({
  user: user.data,
  canTeam: !['USER', 'MANAGER'].includes(user.data.role),
})

const mdtp = {
  logout,
  changeUserData,
}

export default connect(mstp, mdtp)(MyProfile)

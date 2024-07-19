import { connect } from 'react-redux'
import { TeamMembers } from '../screens'

import { deleteUser, editUserName } from '../actions'

const mstp = ({ user }) => ({
  team: user.data.team,
})

const mdtp = {
  deleteUser,
  editUserName,
}

export default connect(mstp, mdtp)(TeamMembers)

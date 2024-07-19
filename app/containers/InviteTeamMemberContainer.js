import { connect } from 'react-redux'
import { InviteTeamMember } from '../components'
import { inviteTeamMember } from '../actions'

const mdtp = {
  inviteTeamMember,
}

const mstp = ({ networks }) => ({
  data: networks.networks,
})

export default connect(mstp, mdtp)(InviteTeamMember)

import { connect } from 'react-redux'
import { SharingSettings } from '../screens'
import { getSharedUsers, updateUserSharedRole, revokeUserAccess } from '../actions'

const mstp = ({ shared, user, networks }) => {
  const revokeNetworks = {}
  networks.result.forEach(network => {
    revokeNetworks[network] = false
  })

  return {
    revokeNetworks: JSON.stringify(revokeNetworks),
    shared: shared.data,
    team: user.data.team,
  }
}

const mdtp = {
  getSharedUsers,
  revokeUserAccess,
  updateUserSharedRole,
}

export default connect(mstp, mdtp)(SharingSettings)

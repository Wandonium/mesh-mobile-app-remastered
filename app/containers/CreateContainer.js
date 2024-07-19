import { connect } from 'react-redux'
import { Create } from '../screens'

const mstp = ({ user }) => ({
  isAdmin: ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.data.role),
})

export default connect(mstp, null)(Create)

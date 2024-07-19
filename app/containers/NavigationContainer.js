import { connect } from 'react-redux'
import Navigation from '../config/router'

const mstp = ({ user }) => ({
  user: user.data,
})

export default connect(mstp, null)(Navigation)

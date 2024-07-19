import { connect } from 'react-redux'
import { Alerts } from '../screens'

import { getAlerts, archiveAlert, archiveAllAlerts } from '../actions'

const mstp = ({ user, alerts }) => ({
  user: user.data,
  alerts: alerts.data.items,
})

const mdtp = {
  getAlerts,
  archiveAlert,
  archiveAllAlerts,
}

export default connect(
  mstp,
  mdtp
)(Alerts)

import { connect } from 'react-redux'
import { ShareNetwork } from '../screens'
import { shareNetwork } from '../actions'

const mdtp = {
  shareNetwork,
}

export default connect(null, mdtp)(ShareNetwork)

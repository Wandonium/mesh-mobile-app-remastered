import { connect } from 'react-redux'
import { Splash } from '../screens'

import { checkToken } from '../actions'

const mdtp = {
  checkToken,
}

export default connect(null, mdtp)(Splash)

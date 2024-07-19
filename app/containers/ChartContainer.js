import { connect } from 'react-redux'
import { Chart } from '../components'
import { getNetworkHistory, getNetworkStatistic } from '../actions'

const mstp = ({ networks }, { network }) => {
  return {
    networkStatistic: networks.networkStatistic,
    networkHistory: networks.networkHistory,
  }
}

const mdtp = (dispatch) => ({
  getNetworkHistory: (d) => dispatch(getNetworkHistory(d)),
  getNetworkStatistic: (a, b, c, d) => dispatch(getNetworkStatistic(a, b, c, d)),
})

export default connect(mstp, mdtp)(Chart)

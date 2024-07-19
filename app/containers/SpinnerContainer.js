import { connect } from 'react-redux'
import { Spinner } from '../screens'
import { cancelRequest } from '../actions'

const mstp = ({ loading, ble }) => ({
  isLoading: loading.isLoading || false,
  loadingCounter: loading.loadingCounter,
  maxNum: loading.maxNum,
  loadingProgress: loading.loadingProgress,
  inBLESearchScreenFlag: ble.inBLESearchScreenFlag
})

const mdtp = {
  cancelRequest
}

export default connect(mstp, mdtp)(Spinner)

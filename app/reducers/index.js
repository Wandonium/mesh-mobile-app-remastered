import { combineReducers } from 'redux'

import user from './user'
import networks, * as fromNetworks from './networks'
import loading from './loading'
import alerts from './alerts'
import shared from './shared'
import captivePortals from './captivePortals'
import bleDfu from './bleDfu'
import ble from './ble'

export default combineReducers({
  user,
  networks,
  loading,
  alerts,
  shared,
  fromNetworks,
  captivePortals,
  bleDfu,
  ble
})

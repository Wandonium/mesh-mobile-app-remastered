import React from 'react'
import { useNetInfo } from '@react-native-community/netinfo'

export const NetworkContext = React.createContext({ isConnected: true, isInternetReachable: true })

export const NetworkProvider = props => {
  const netInfo = useNetInfo()
  return <NetworkContext.Provider value={netInfo}>{props.children}</NetworkContext.Provider>
}

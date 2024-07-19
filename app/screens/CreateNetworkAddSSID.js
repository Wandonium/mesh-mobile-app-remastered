import React from 'react'
import { DefaultHeaderHOC } from '../components'
import { SSIDList } from '../containers'

export default CreateNetworkAddSSID = ({ navigation, route }) => {
  const goBack = () => {
    navigation.goBack(null)
  }

  return (
    <DefaultHeaderHOC title="Create SSID" navigation={navigation}>
      <SSIDList networkId={route.params?.networkId} toggleModal={goBack} />
    </DefaultHeaderHOC>
  )
}

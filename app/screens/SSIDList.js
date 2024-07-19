import React from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import { Button, UniversalItem, DefaultHeaderHOC } from '../components'
import { useTheme } from '../theme/ThemeManager'

const securityList = ['WPA', 'WPA2', 'WPA/WPA2 Mixed Mode', 'None', 'WPA2 Enterprise']

const SSIDList = ({ network, navigation, deleteSSID }) => {
  const { theme } = useTheme()

  const actionWithSSID = order => {
    Alert.alert(
      'Please select from the following',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => onEdit(order) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(order) },
      ],
      { cancelable: false },
    )
  }

  const goBack = () => navigation.goBack(null)

  const onCreate = () => {
    navigation.navigate('CreateSSID', { networkId: network.id })
  }

  const onEdit = order => {
    const SSID = network.ssid.find(ssid => Number(ssid.order) === order)
    navigation.navigate('CreateSSID', { SSID, networkId: network.id })
  }

  const onDelete = order => {
    return deleteSSID(network.id, order)
  }

  const renderSSIDList = ssid => 
    ssid.map(SSID => (
      <UniversalItem
        type="ssid"
        key={SSID.id.toString()}
        item={{ ...SSID, security: securityList[SSID.security] }}
        onLongPress={() => actionWithSSID(SSID.order)}
        onPress={() => navigation.navigate('CreateSSID', { SSID, networkId: network.id })}
      />
    ))

  return (
    <DefaultHeaderHOC title="SSIDs" navigation={navigation}>
      <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
        <View style={styles.ssidWrap}>{!!network.ssid && !!network.ssid.length && renderSSIDList(network.ssid)}</View>
        <View style={{ ...styles.section, backgroundColor: theme.primaryBackground }}>
          {(!network.ssid || network.ssid.length < 4) && <Button active text="Create SSID" onPress={onCreate} />}
          <Button text="Back" onPress={goBack} />
        </View>
      </View>
    </DefaultHeaderHOC>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
  },
  ssidWrap: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  section: {
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E6ECF5',
  },
})

export default SSIDList

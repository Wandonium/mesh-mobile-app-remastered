import React, { PureComponent } from 'react'
import { StackActions } from '@react-navigation/native'
import { StyleSheet, View, Text } from 'react-native'
import { Button, DefaultHeaderHOC } from '../components'

export default class CreateNodeDone extends PureComponent {
  static navigationOptions = {
    gestureEnabled: false,
  }

  componentDidMount() {
    const networkId = this.props.route.params?.id
    console.log('[CreateNodeDone.js] - componentDidMount', networkId)
    this.props.refreshOneNetwork(networkId)
  }

  done = () => {
    const { navigation, route } = this.props
    if (route.params?.newNetwork) {

      navigation.pop(2)
    } else {
      console.log('[CreateNodeDone.js] - Going back to BLE')
      navigation.dispatch(StackActions.popToTop())
    }
  }

  createNode = () => {
    this.props.navigation.navigate('NodeManual', { clearState: true, mode: 'create' })
  }

  render() {
    const { navigation, route } = this.props
    const { mac, name, full_address } = route.params?.nodeData
    const networkName = route.params?.networkName
    const newNetwork = route.params?.newNetwork

    return (
      <DefaultHeaderHOC disableBackButton title="Create Node">
        <View style={styles.container}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.circle} />

            <Text numberOfLines={1} style={styles.nodeName}>
              {name}
            </Text>
            <Text numberOfLines={1} style={styles.networkName}>
              to {networkName}
            </Text>
            <Text numberOfLines={1} style={styles.address}>
              {full_address}
            </Text>
            <Text style={styles.macAddress}>MAC Address</Text>
            <Text style={styles.macAddressValue}>{mac.toUpperCase()}</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.adopted}>ADOPTED</Text>
            <Text style={styles.description}>
              You have connected the node to {networkName} successfully. You can be done with setup or add another one
            </Text>
          </View>

          <View>
            <Button testID="CreateNodeDone" active text="Done" onPress={this.done} />
            {!newNetwork && <Button text="Add Another Node" onPress={this.createNode} />}
          </View>
        </View>
      </DefaultHeaderHOC>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  circle: {
    marginTop: 20,
    width: 100,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgb(31,209,111)',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#B0B7C2',
    marginTop: 10,
  },
  nodeName: {
    fontSize: 22,
    marginTop: 20,
    color: '#333',
  },
  networkName: {
    fontSize: 18,
    marginTop: 10,
    color: '#777',
  },
  macAddressValue: {
    fontSize: 20,
    marginTop: 5,
    color: '#333',
  },
  macAddress: {
    fontSize: 16,
    color: '#555',
  },
  address: {
    fontSize: 19,
    marginHorizontal: 20,
    marginVertical: 20,
    color: '#999',
  },
  adopted: {
    fontSize: 20,
    color: '#1FD16F',
  },
})

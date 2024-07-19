import React, { Component } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, BackHandler } from 'react-native'
import { StackActions, NavigationActions } from '@react-navigation/native'
import { Button, DefaultHeaderHOC } from '../components'
import { CreateIcon, WiFi, NetworkCreated } from '../components/svg'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class CreateNetworkDone extends Component {
  static navigationOptions = {
    gestureEnabled: false,
  }

  componentDidMount() {
    
    // eslint-disable-next-line no-unused-vars
    this.focusListener = this.props.navigation.addListener('focus', _ =>
      this.backHandlerListener = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress),
    )
    // eslint-disable-next-line no-unused-vars
    this.blurListener = this.props.navigation.addListener('blur', _ =>
      this.backHandlerListener.remove()
    )
  }

  componentWillUnmount() {
    this.focusListener()
    this.blurListener()
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress)
  }

  handleBackPress = () => {
    return true
  }

  navigateTo = route => {
    const { navigation, network } = this.props

    if (route === 'reset') {
      console.log('[CreateNetworkDone.js] - navigate to reset')
      navigation.setParams({ fromCreateNetworkDone: false })
      this.props.navigation.reset({
        index: 0,
        routes: [{ name: 'Create' }],
      })
    } else if (network) {
      console.log('[CreateNetworkDone.js] - navigate to network')
      navigation.navigate(route, { networkId: network.id,  fromCreateNetworkDone: true})
    }
  }

  onPressCreateSSID = () => {
    const { network, navigation } = this.props

    if ((!network?.ssid || !network?.ssid.length) && network?.id) {
      navigation.navigate('CreateSSID', { networkId: network.id })
    } else {
      this.navigateTo('SSIDList')
    }
  }

  onPressCreateNode = () => {
    const { network, navigation } = this.props

    if (!network?.aps || !network?.aps.length) {
      console.log('[CreateNetworkDone.js] - go to Network')
      this.navigateTo('Network')
    } else {
      console.log('[CreateNetworkDone.js] - go to CreateNetworkAddNode')
      this.navigateTo('CreateNetworkAddNode')
    }
  }

  render() {
    const { network = { name: '' } } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC disableBackButton title="Create Network">
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View>
                <View style={styles.check}>
                  <NetworkCreated />
                </View>
                <Text style={{ ...styles.networkName, color: theme.primaryText }}>{network.name}</Text>

                <View style={styles.buttonsWrap}>
                  <TouchableOpacity onPress={this.onPressCreateNode} style={styles.button}>
                    <View style={styles.circle}>
                      <CreateIcon focused size={34} />
                    </View>
                    <Text style={styles.buttonText}>Add Nodes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this.onPressCreateSSID} style={styles.button}>
                    <View style={styles.circle}>
                      <WiFi fill="#1F6BFF" size={34} />
                    </View>
                    <Text style={styles.buttonText}>Create SSID</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Button testID="CreateNetworkDone" active text="Done" onPress={() => this.navigateTo('reset')} />
            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  check: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  networkName: {
    marginTop: 16,
    fontSize: 18,
    // color: '#101114',
    alignSelf: 'center',
  },
  buttonsWrap: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    alignItems: 'center',
  },
  circle: {
    width: 80,
    aspectRatio: 1,
    borderRadius: 40,
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 16,
    color: '#1F6BFF',
  },
})

import React, { PureComponent } from 'react'
import { StyleSheet, View } from 'react-native'
import { Logo } from '../components/svg'
import { BLEService } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class Splash extends PureComponent {
  componentDidMount() {
    const { navigation, checkToken } = this.props
    BLEService.startBleManager()
      .then(() => {
        console.log('[BLESearch.js] - Ble manager started')
      })
      .catch((e) => {
        console.log('[BLESearch.js] - Ble manager startup error: ' + e)
      })
    checkToken(navigation)
  }

  render() {
    return (
      <ManageThemeContext.Consumer>
      {({ theme }) => (
        <View style={{ ...styles.container, backgroundColor: theme.primaryBackground}}>
          <View style={styles.logoWrap}>
            <Logo />
          </View>
        </View>
      )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: 180,
  },
})

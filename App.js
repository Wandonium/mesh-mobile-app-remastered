import React from 'react'
import { StyleSheet, StatusBar } from 'react-native'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import DropdownAlert from 'react-native-dropdownalert'

import { SpinnerContainer } from './app/containers'
import { NetworkProvider } from './app/components/NetworkProvider'
import { ThemeManager } from './app/theme/ThemeManager'
import { AlertHelper } from './app/services'
import { Navigation } from './app/containers'
import store, { persistor } from './app/store'
import { Spinner } from './app/screens'

import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { enableLatestRenderer } from 'react-native-maps'
import { RootSiblingParent } from 'react-native-root-siblings'


enableLatestRenderer()
GestureHandlerRootView()
console.warn = () => {}

export default App = () => (
  <Provider store={store}>
    <NetworkProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeManager>
          <PersistGate persistor={persistor} loading={<Spinner isLoading />}>
            <RootSiblingParent>
              <Navigation />
            </RootSiblingParent>
            <SpinnerContainer />
            <DropdownAlert
              successImageSrc={null}
              infoColor="#4482FF"
              errorColor="#EB4E4D"
              successColor="#00B860"
              messageNumOfLines={10}
              defaultContainer={styles.alertContainer}
              ref={(ref) => AlertHelper.setDropDown(ref)}
              onClose={() => AlertHelper.invokeOnClose()}
              onClose={() => AlertHelper.invokeOnClose()}
            />
          </PersistGate>
        </ThemeManager>
      </GestureHandlerRootView>
    </NetworkProvider>
  </Provider>
)

const styles = StyleSheet.create({
  alertContainer: {
    padding: 8,
    paddingTop: StatusBar.currentHeight,
    flexDirection: 'row',
  },
})

import { AppRegistry, YellowBox } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

YellowBox.ignoreWarnings(['`-[RCTRootView cancelTouches]`', 'Warning: component', 'Warning: Failed prop type'])

AppRegistry.registerComponent(appName, () => App)

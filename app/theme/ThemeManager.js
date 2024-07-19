import React from 'react'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTheme } from './index'

const osTheme = Appearance.getColorScheme()
const getInitialTheme = async () => {
  const storageTheme = await AsyncStorage.getItem('darkTheme')
  console.log('[ThemeManager.js] - storageTheme, ', storageTheme)
  if(storageTheme === 'no-preference' || storageTheme === null)
    return 'light'
  else
    return storageTheme
}

export const ManageThemeContext = React.createContext({
  mode: osTheme === 'no-preference' ? 'light' : osTheme,
  theme: getTheme(osTheme),
  toggle: () => {},
})

export const useTheme = () => React.useContext(ManageThemeContext)

export class ThemeManager extends React.Component {
  state = {
    mode: 'light',
  }

  componentDidMount() {
    getInitialTheme().then((res) => {
      this.setState({ mode: res })
    })
  }

  toggleTheme = async (mode) => {
    const nextMode = mode === 'light' ? 'dark' : 'light'
    await AsyncStorage.setItem('darkTheme', nextMode)
    this.setState({ mode: nextMode })
  }

  render() {
    return (
      <ManageThemeContext.Provider
        value={{
          mode: this.state.mode,
          theme: getTheme(this.state.mode),
          toggle: this.toggleTheme,
        }}>
        {this.props.children}
      </ManageThemeContext.Provider>
    )
  }
}

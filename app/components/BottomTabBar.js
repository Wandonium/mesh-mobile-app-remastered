import React from 'react'
import { BottomTabBar } from '@react-navigation/bottom-tabs'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class ThemedBottomTabBar extends React.Component {
  render() {
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <BottomTabBar
            {...this.props}
            activeTintColor="#444444"
            inactiveTintColor="#555555"
            style={{
              height: 52,
              backgroundColor: theme.primaryBackground,
            }}
          />
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

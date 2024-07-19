import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ focused, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={focused ? '#1F6BFF' : '#a3acba'} d="M4.3 6.7H2a1.2 1.2 0 1 1 0-2.4h2.3V2a1.2 1.2 0 1 1 2.4 0v2.3H9a1.2 1.2 0 1 1 0 2.4H6.7V9a1.2 1.2 0 1 1-2.4 0V6.7zM17 13h4a1.5 1.5 0 0 1 0 3h-4v4a1.5 1.5 0 0 1-3 0v-4h-4a1.5 1.5 0 0 1 0-3h4V9a1.5 1.5 0 0 1 3 0v4z" fillRule="evenodd" />
  </Svg>
)
import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ focused }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Path fill={focused ? '#1F6BFF' : '#a3acba'} d="M4 16.99v1.357c.35.213 3.146 1.65 8 1.65s7.65-1.435 8-1.649V16.99c0-1.716-3.807-3.05-4.078-3.152C15.07 15.366 13.812 16.5 12 16.5c-1.81 0-3.069-1.133-3.92-2.66-.269.1-4.08 1.43-4.08 3.15zM6.5 7.18C6.5 4.319 8.962 2 12 2s5.5 2.319 5.5 5.179c0 1.213-.212 3.075-.786 4.817C18.717 12.761 22 14.001 22 16.99v2.008C22 20.103 17.685 22 12 22S2 20.099 2 18.998V16.99c0-3 3.285-4.228 5.287-4.991-.575-1.743-.787-3.606-.787-4.82zM12 14.5c1.97 0 3.5-3.617 3.5-7.321C15.5 5.45 13.959 4 12 4S8.5 5.45 8.5 7.179c0 3.704 1.53 7.321 3.5 7.321z" fillRule="evenodd" />
  </Svg>
)
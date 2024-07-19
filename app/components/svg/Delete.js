import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#1F6BFF" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fillRule="evenodd" />
  </Svg>
)
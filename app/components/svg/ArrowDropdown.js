import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={fill} d="M7 10l5 5 5-5z" fillRule="evenodd" />
  </Svg>
)
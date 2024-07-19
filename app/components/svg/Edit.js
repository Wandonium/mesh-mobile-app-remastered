import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#1F6BFF" d="M4 16.667V20h3.333l9.83-9.83-3.333-3.333L4 16.667zm15.74-9.074a.885.885 0 0 0 0-1.253l-2.08-2.08a.885.885 0 0 0-1.253 0l-1.626 1.626 3.333 3.333 1.626-1.626z"  fillRule="evenodd" />
  </Svg>
)
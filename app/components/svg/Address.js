import React from 'react'
import Svg, { Path } from 'react-native-svg'
/* SVGR has dropped some elements not supported by react-native-svg: title */

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M19.643 12.698a7.675 7.675 0 0 1-6.945 6.945v1.66a.698.698 0 0 1-1.396 0v-1.66a7.677 7.677 0 0 1-6.945-6.945h-1.66a.698.698 0 0 1 0-1.396h1.66a7.677 7.677 0 0 1 6.945-6.945v-1.66a.698.698 0 0 1 1.396 0v1.66a7.677 7.677 0 0 1 6.945 6.945h1.66a.698.698 0 0 1 0 1.396h-1.66zm-1.402 0h-1.59a.698.698 0 1 1 0-1.396h1.59a6.282 6.282 0 0 0-5.543-5.543v1.59a.698.698 0 0 1-1.396 0v-1.59a6.282 6.282 0 0 0-5.543 5.543h1.59a.698.698 0 0 1 0 1.396h-1.59a6.282 6.282 0 0 0 5.543 5.543v-1.59a.698.698 0 1 1 1.396 0v1.59a6.282 6.282 0 0 0 5.543-5.543z"
      fill={fill}
      fillRule="evenodd"
    />
  </Svg>
)

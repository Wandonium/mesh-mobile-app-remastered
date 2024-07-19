import React from 'react'
import Svg, { Path, Defs, Use } from 'react-native-svg'

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <Path
        d="M5 8h14a1 1 0 0 1 0 2H5a1 1 0 1 1 0-2zm3 4h8a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2zm3 4h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2z"
        id="prefix__a"
      />
    </Defs>
    <Use fill={fill} xlinkHref="#prefix__a" fillRule="evenodd" />
  </Svg>
)

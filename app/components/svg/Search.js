import React from 'react'
import Svg, { Path, Defs, Use } from 'react-native-svg'

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <Path
        d="M16.436 15.085l3.94 4.01a1 1 0 0 1-1.425 1.402l-3.938-4.006a7.5 7.5 0 1 1 1.423-1.406zM10.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"
        id="prefix__a"
      />
    </Defs>
    <Use fill={fill} xlinkHref="#prefix__a" fillRule="evenodd" />
  </Svg>
)

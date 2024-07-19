import React from 'react'
import Svg, { Defs, Path, Use } from 'react-native-svg'

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <Path
        d="M14.83 17H19V5H5v12h4.17a3.001 3.001 0 0 0 5.66 0zM3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm4-7h10v2H7v-2zm0-4h10v2H7V8z"
        id="prefix__a"
      />
    </Defs>
    <Use fill={fill} xlinkHref="#prefix__a" fillRule="evenodd" />
  </Svg>
)

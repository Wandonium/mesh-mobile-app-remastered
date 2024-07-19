import React from 'react'
import Svg, { Defs, Path, Use } from 'react-native-svg'

export default ({ size = 24, fill = '#101114' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <Path
        id="prefix__a"
        d="M12 9.98l7.561-7.562a1.429 1.429 0 0 1 2.02 2.02L14.022 12l7.56 7.561a1.429 1.429 0 1 1-2.02 2.02L12 14.022l-7.561 7.56a1.429 1.429 0 1 1-2.02-2.02L9.978 12 2.42 4.439a1.429 1.429 0 0 1 2.02-2.02L12 9.978z"
      />
    </Defs>
    <Use fill={fill} xlinkHref="#prefix__a" fillRule="evenodd" />
  </Svg>
)

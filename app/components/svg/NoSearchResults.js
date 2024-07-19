import React from 'react'
import Svg, { Defs, Path, G, Circle, Use } from 'react-native-svg'

export default ({ width = 250, height = 250 }) => (
  <Svg width={width} height={height}>
    <Defs>
      <Path
        d="M57.375 51.94L72.251 66.96a3.726 3.726 0 0 1-.046 5.298 3.794 3.794 0 0 1-5.338-.046L52.006 57.205a28.32 28.32 0 0 1-17.033 5.653c-15.633 0-28.306-12.579-28.306-28.096 0-15.516 12.673-28.095 28.306-28.095 15.634 0 28.307 12.579 28.307 28.095a27.84 27.84 0 0 1-5.905 17.177zm-22.402 3.426c11.465 0 20.758-9.225 20.758-20.604S46.438 14.16 34.973 14.16c-11.464 0-20.758 9.224-20.758 20.603 0 11.38 9.294 20.604 20.758 20.604z"
        id="prefix__a"
      />
    </Defs>
    <G transform="translate(1 1)" fill="none" fillRule="evenodd">
      <Circle stroke="#DAE0E8" fill="#F0F3F8" cx={124} cy={124} r={71} />
      <Use fill="#CED5E0" xlinkHref="#prefix__a" transform="translate(84 84)" />
      <Circle stroke="#DAE0E8" cx={124} cy={124} r={95} />
      <Circle stroke="#E8EDF3" cx={124} cy={124} r={124} />
    </G>
  </Svg>
)
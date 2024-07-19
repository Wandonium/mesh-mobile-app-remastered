import React from 'react'
import Svg, { Defs, Path, G, Use } from 'react-native-svg'

export default ({ size = 24, color = '#00B65C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <Path
        d="M5.607 11.19a1.224 1.224 0 0 0-1.716-.07 1.191 1.191 0 0 0-.07 1.696l4.387 4.706c.652.631 1.624.631 2.227.035l.442-.43a2822.332 2822.332 0 0 0 4.783-4.662l.049-.048a594.858 594.858 0 0 0 4.441-4.373 1.191 1.191 0 0 0-.012-1.698 1.224 1.224 0 0 0-1.717.011c-.854.857-2.393 2.371-4.42 4.353l-.049.047a2474.905 2474.905 0 0 1-4.584 4.47l-3.76-4.038z"
        id="a"
      />
    </Defs>
    <G stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
      <Use fill={color} xlinkHref="#a" />
    </G>
  </Svg>
)

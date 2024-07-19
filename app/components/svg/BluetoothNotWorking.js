import React from 'react'
import Svg, { G, Circle, Path } from 'react-native-svg'

export default ({ width = 250, height = 250 }) => (
  <Svg width={width} height={height}>
    <G fill="none" fillRule="evenodd">
      <G stroke="#EB0101" transform="translate(1 1)">
        <Circle fill="#F7DFDF" opacity={0.3} cx={124} cy={124} r={71} />
        <Circle opacity={0.25} cx={124} cy={124} r={95} />
        <Circle opacity={0.2} cx={124} cy={124} r={124} />
      </G>
      <Path
        d="M144 110.667l-19-19h-3.333V117l-15.334-15.333-4.666 4.666L120.333 125l-18.666 18.667 4.666 4.666L121.667 133v25.333H125l19-19L129.667 125 144 110.667zm-15.667-6.334l6.334 6.334-6.334 6.333v-12.667zm6.334 35l-6.334 6.334V133l6.334 6.333z"
        opacity={0.3}
        fill="#EB4E4D"
      />
    </G>
  </Svg>
)
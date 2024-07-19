import React from 'react'
import Svg, { Defs, Path, G, Circle, Use } from 'react-native-svg'

export default ({ width = 250, height = 250 }) => (
  <Svg width={width} height={height}>
    <Defs>
      <Path
        d="M11.214 22.378a2.448 2.448 0 0 0-3.431-.138 2.382 2.382 0 0 0-.14 3.393l8.772 9.41c1.305 1.264 3.249 1.264 4.455.071l.885-.86a5643.443 5643.443 0 0 0 9.565-9.324l.098-.096c4.067-3.977 7.154-7.015 8.882-8.747a2.382 2.382 0 0 0-.023-3.395 2.448 2.448 0 0 0-3.435.023c-1.709 1.713-4.787 4.741-8.84 8.704l-.098.096a4949.754 4949.754 0 0 1-9.167 8.938l-7.523-8.075z"
        id="prefix__a"
      />
    </Defs>
    <G fill="none" fillRule="evenodd">
      <G transform="translate(1 1)">
        <Circle stroke="#E6EEFF" cx={124} cy={124} r={124} />
        <Circle stroke="#CDF" cx={124} cy={124} r={95} />
        <Circle stroke="#C9E0FB" fill="#2B72FF" cx={124} cy={124} r={71} />
      </G>
      <Use fill="#FFF" xlinkHref="#prefix__a" transform="translate(101 101)" />
    </G>
  </Svg>
)
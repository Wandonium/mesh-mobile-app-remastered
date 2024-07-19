import React from 'react'
import Svg, { Path, G } from 'react-native-svg'

const getColor = percent => {
  if (percent >= 75) {
    return '#00B860'
  } else if (percent >= 50) {
    return '#FFD600'
  } else if (percent >= 25) {
    return '#F39629'
  } else return '#F6522E'
}

export default ({ size = 16, percent = 100 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="none" d="M-1-1h582v402H-1z" />
    <G>
      <G fillRule="evenodd" fill="none" strokeWidth={0}>
        <Path
          fill={percent >= 75 ? getColor(percent) : '#E6ECF5'}
          d="M16.647 3.283h-2.45V2h-4.5v1.283H7.244c-.716 0-1.299.499-1.299 1.112v3.06h12v-3.06c0-.613-.582-1.112-1.299-1.112z"
        />
        <Path
          fill={percent >= 25 ? getColor(percent) : '#E6ECF5'}
          d="M5.946 8.061h12v4.242h-12zM5.946 12.909h12v4.242h-12z"
        />
        <Path fill={percent >= 50 ? getColor(percent) : '#E6ECF5'} d="M5.931 8.043h12.028v4.276H5.931z" />
        <Path
          fill={getColor(percent)}
          d="M5.946 20.87c0 .623.583 1.13 1.3 1.13h9.401c.717 0 1.3-.507 1.3-1.13v-3.112h-12v3.112z"
        />
      </G>
    </G>
  </Svg>
)

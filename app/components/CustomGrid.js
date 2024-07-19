import React from 'react'
import { G, Line } from 'react-native-svg'
import { useTheme } from '../theme/ThemeManager'

const verticalGrid = data => {
  const { length } = data[0].data
  const vertical = []
  const step = 100 / length
  for (let i = 0; i <= length; i++) {
    vertical.push(`${step * i}%`)
  }
  return vertical
}

export default ({ y, data, ticks }) => {
  const vertical = verticalGrid(data)
  const { theme } = useTheme()
  const stroke = theme.primaryChartStroke

  return (
    <G>
      <Line stroke={stroke} x1="0%" x2="100%" y1="0%" y2="0%" />
      {// Horizontal grid
      ticks.map(tick => (
        <Line stroke={stroke} strokeDasharray="2, 2" key={tick} x1="0%" x2="100%" y1={y(tick)} y2={y(tick)} />
      ))}
      {// Vertical grid
      vertical.map((perc, index) => (
        <Line stroke={stroke} strokeDasharray="2, 2" key={index} y1="0%" y2="100%" x1={perc} x2={perc} />
      ))}
    </G>
  )
}

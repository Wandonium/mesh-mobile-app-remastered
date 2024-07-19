import React from 'react'
import { View } from 'react-native'

class RenderPaginationItem extends React.Component {
  render() {
    const { index, color, currentPageNum } = this.props
    const isSelected = index === currentPageNum + 4

    return (
      <View
        style={{
          width: isSelected ? 8 : 6,
          height: isSelected ? 8 : 6,
          borderRadius: 4,
          marginHorizontal: 2,
          backgroundColor: color,
          opacity: isSelected ? 1 : 0.6,
        }}
      />
    )
  }
}

export default RenderPaginationItem

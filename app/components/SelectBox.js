import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { ChevronRight } from './svg'
import { useTheme } from '../theme/ThemeManager'

export default function ({
  title,
  testID,
  subTitle,
  onPress,
  disableBorderBottom,
  rightText,
  rightTextColor = '#2550D9',
}) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[
        { ...styles.select, borderColor: theme.primaryBorder },
        disableBorderBottom && styles.disableBorderBottom,
      ]}>
      <View style={styles.flex}>
        <Text numberOfLines={1} style={{ ...styles.selectTitle, color: theme.primaryText }}>
          {title}
        </Text>
        {!!subTitle && (
          <Text numberOfLines={1} style={{ ...styles.selectSubtitle }}>
            {subTitle}
          </Text>
        )}
      </View>
      {rightText ? <Text style={[styles.rightText, { color: rightTextColor }]}>{rightText}</Text> : <ChevronRight />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  select: {
    height: 60,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  disableBorderBottom: {
    borderBottomWidth: 0,
  },
  flex: {
    flex: 1,
  },
  selectTitle: {
    fontSize: 16,
  },
  selectSubtitle: {
    marginTop: 4,
    color: '#8F97A3',
    fontSize: 12,
  },
  rightText: {
    fontSize: 16,
  },
})

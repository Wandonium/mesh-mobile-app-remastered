import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useTheme } from '../theme/ThemeManager'

export default function({ testID, title, buttonText, showButton, onPress }) {
  const { theme } = useTheme()

  return (
    <View style={{ ...styles.header, color: theme.primaryText }}>
      <Text style={{ ...styles.title, color: theme.primaryText }}>{title}</Text>
      {showButton && (
        <TouchableOpacity testID={testID} onPress={onPress}>
          <Text style={styles.button}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
  },
  button: {
    fontSize: 16,
    color: '#1F6BFF',
  },
})

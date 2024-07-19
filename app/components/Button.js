import React from 'react'
import { StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useTheme } from '../theme/ThemeManager'

export default Button = React.forwardRef(
  ({ text, onPress, active, testID, disabled = false, isRow, isLoading = false }, ref) => {
    const { theme } = useTheme()
    return (
      <TouchableOpacity
        testID={testID}
        ref={ref}
        style={[
          { ...styles.button, backgroundColor: theme.primaryButtonGray },
          active && styles.activeButton,
          isRow && styles.row,
        ]}
        disabled={disabled}
        onPress={onPress}>
        <Text style={[styles.buttonText, active && styles.activeButtonText]}>{text}</Text>
        {isLoading && <ActivityIndicator size={28} color="#1F6BFF" style={styles.spinner} />}
      </TouchableOpacity>
    )
  },
)

const styles = StyleSheet.create({
  button: {
    height: 48,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeButton: {
    backgroundColor: '#1F6BFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#004AD9',
  },
  activeButtonText: {
    color: '#fff',
  },
  row: {
    flex: 1,
    marginHorizontal: 8,
  },
  spinner: {
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
})

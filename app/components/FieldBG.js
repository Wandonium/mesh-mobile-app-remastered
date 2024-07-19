import React from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native'
import { HideEye, ShowEye } from './svg'
import { useTheme } from '../theme/ThemeManager'

export default ({
  value,
  label,
  onChangeText,
  placeholder,
  testID,
  secureTextEntry = false,
  warningText = null,
  clearButtonMode = 'never',
  keyboardType = Platform.OS === 'android' ? 'default' : 'ascii-capable',
  textContentType = 'none',
  autoCompleteType = 'off',
  toggleSecureTextEntry = null,
  isSecure = false,
}) => {
  const { theme } = useTheme()
  return (
    <View>
      {label && <Text style={{ ...styles.label, color: theme.primaryText }}>{label}</Text>}
      <View>
        <TextInput
          testID={testID}
          style={{ ...styles.field, borderColor: theme.primaryBorder, color: theme.primaryText }}
          value={value}
          returnKeyType="done"
          clearButtonMode={clearButtonMode}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCompleteType={autoCompleteType}
          textContentType={textContentType}
          placeholder={placeholder}
          backgroundColor={theme.primaryCardBgr}
          borderBottomColor={warningText ? '#FFAB00' : theme.primaryBorder}
          borderBottomWidth={2}
          placeholderTextColor="#666F7A"
          onChangeText={onChangeText}
        />
        {isSecure && (
          <TouchableOpacity style={styles.eye} onPress={toggleSecureTextEntry}>
            {secureTextEntry ? <HideEye /> : <ShowEye />}
          </TouchableOpacity>
        )}
        {warningText && <Text style={[styles.warning]}>{warningText}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    paddingHorizontal: 16,
    fontSize: 12,
    height: 18,
    marginTop: 16,
    color: '#8F97A3',
  },
  field: {
    height: 48,
    fontSize: 16,
    marginTop: 4,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 5,
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: 6,
    padding: 10,
  },
  warning: {
    paddingTop: 6,
    color: '#FFAB00',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
})

import React from 'react'
import { StyleSheet, View, Text, TextInput } from 'react-native'
import { useTheme } from '../theme/ThemeManager'

export default ({
  value,
  label,
  testID,
  editable,
  placeholder,
  onChangeText,
  onEndEditing,
  secureTextEntry,
  disableBorderBottom,
  // keyboardType = Platform.OS === 'android' ? 'default' : 'ascii-capable',
  autoCapitalize = 'none',
  returnKeyType = 'done',
  icon,
}) => {
  const { theme } = useTheme()

  return (
    <View style={styles.fieldWrap}>
      <Text style={{ ...styles.label, color: theme.primaryText }}>{label}</Text>
      <View style={styles.fieldContainer}>
        <TextInput
          testID={testID}
          editable={editable}
          returnKeyType={returnKeyType}
          onEndEditing={onEndEditing}
          autoCapitalize={autoCapitalize}
          value={value}
          onChangeText={onChangeText}
          style={[
            { ...styles.field, borderColor: theme.primaryBorder, color: theme.primaryText },
            disableBorderBottom && styles.disableBorderBottom,
          ]}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={theme.primaryLightGray}
        />
        {icon ? <>{icon}</> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldWrap: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    color: '#101114',
  },
  field: {
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  disableBorderBottom: {
    borderBottomWidth: 0,
  },
})

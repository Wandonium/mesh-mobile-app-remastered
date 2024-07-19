import React from 'react'
import { StyleSheet, View, Text, Switch } from 'react-native'
import { useTheme } from '../theme/ThemeManager'

export default function({ label, onValueChange, value, borderBottom, subTitle }) {
  const { theme } = useTheme()
  return (
    <View style={[styles.switchWrap, borderBottom && styles.borderBottom]}>
      <View style={styles.labelWrap}>
        <Text style={{ ...styles.switchLabel, color: theme.primaryText }}>{label}</Text>
        {!!subTitle && (
          <Text numberOfLines={2} style={styles.subTitle}>
            {subTitle}
          </Text>
        )}
      </View>
      <Switch
        ios_backgroundColor="#E6ECF5"
        thumbColor="#FFF"
        trackColor={{
          false: '#E6ECF5',
          true: '#1F6BFF',
        }}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  switchWrap: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelWrap: {
    maxWidth: '85%',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  switchLabel: {
    fontSize: 16,
    color: '#101114',
  },
  subTitle: {
    marginTop: 4,
    color: '#8F97A3',
    fontSize: 12,
  },
})

import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Platform, NativeModules } from 'react-native'
import { ChevronLeft } from './svg'
import { getStatusBarHeight } from '../services'
import { useTheme } from '../theme/ThemeManager'

export default function({ title, disableBackButton, children, navigation }) {
  const { theme } = useTheme()
  return (
    <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
      <View style={{ ...styles.header, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
        {!disableBackButton ? (
          <TouchableOpacity style={styles.block} onPress={() => navigation.goBack(null)}>
            <ChevronLeft />
          </TouchableOpacity>
        ) : (
          <View style={styles.block} />
        )}
        {title && <Text style={{ ...styles.title, color: theme.primaryText }}>{title}</Text>}
        <View style={styles.block} />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? NativeModules.StatusBarManager.HEIGHT : getStatusBarHeight(),
    backgroundColor: '#FFF',
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  title: {
    textAlign: 'center',
    flexGrow: 1,
    fontSize: 22,
    fontWeight: '400',
  },
  block: {
    flex: 1,
    padding: 8,
  },
})

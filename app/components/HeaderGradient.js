import React from 'react'
import { StyleSheet, TouchableOpacity, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { LeftArrow } from './svg'
import { getStatusBarHeight } from '../services'

export default function({ onPress, text }) {
  return (
    <LinearGradient colors={['rgba(0,0,0,.5)', 'transparent']} style={styles.linearGradient}>
      <TouchableOpacity onPress={onPress} style={styles.back}>
        <LeftArrow />
        {text && <Text style={styles.backText}>{text}</Text>}
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  linearGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 120,
    justifyContent: 'center',
  },
  back: {
    paddingTop: getStatusBarHeight(),
    padding: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
})

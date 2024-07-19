import React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

export default function() {
  return <LinearGradient colors={['transparent', 'rgba(0,0,0,.5)']} style={styles.linearGradient} />
}

const styles = StyleSheet.create({
  linearGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 120,
    justifyContent: 'center',
  },
})

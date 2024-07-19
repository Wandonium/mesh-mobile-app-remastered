import React from 'react'
import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity } from 'react-native'
import Modal from 'react-native-modal'
import { Close } from './svg'
import { useTheme } from '../theme/ThemeManager'

export default function({ children, title, isModalVisible, toggleModal }) {
  const { theme } = useTheme()

  return (
    <Modal
      propagateSwipe
      style={{ ...styles.modal }}
      onSwipeComplete={toggleModal}
      onBackdropPress={toggleModal}
      swipeDirection={['down']}
      isVisible={isModalVisible}>
      <SafeAreaView style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
        <View style={{ ...styles.header, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
          <Text style={{ ...styles.title, color: theme.primaryText }}>{title}</Text>
          <TouchableOpacity onPress={toggleModal} style={styles.headerCloseButton}>
            <Close size={20} fill={theme.primaryText} />
          </TouchableOpacity>
        </View>
        {children}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: '#101114',
  },
  headerCloseButton: {
    position: 'absolute',
    padding: 10,
    right: 6,
    opacity: 0.4,
  },
})

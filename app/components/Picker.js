import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Picker, Platform } from 'react-native'
import Modal from 'react-native-modal'
import { ArrowDropdown } from './svg'
import { useTheme } from '../theme/ThemeManager'

export default function({
  child = true,
  label,
  items,
  selectedValue,
  isModalVisible,
  toggleModal,
  onValueChange,
  disableBorderBottom,
}) {
  const { theme } = useTheme()
  return (
    <>
      {child && (
        <View style={styles.selectWrap}>
          <Text style={{ ...styles.label, color: theme.primaryText }}>{label}</Text>
          <TouchableOpacity
            style={[styles.select, disableBorderBottom && styles.disableBorderBottom]}
            onPress={toggleModal}>
            <Text style={{ ...styles.selectText, color: theme.primaryText }}>{items[selectedValue]}</Text>
            <ArrowDropdown fill="#555" size={28} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        propagateSwipe
        style={styles.modal}
        onSwipeComplete={toggleModal}
        onBackdropPress={toggleModal}
        swipeDirection={['down']}
        isVisible={isModalVisible}>
        <View style={{ ...styles.pickerWrap, backgroundColor: theme.primaryBackground }}>
          <TouchableOpacity onPress={toggleModal} style={styles.pickerDone}>
            <Text style={{ ...styles.pickerDoneText, color: theme.primaryText }}>Done</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' ? (
            <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
              {items.map((itemLabel, index) => (
                <Picker.Item
                  key={index}
                  label={itemLabel}
                  value={index}
                  style={{ color: theme.primaryText }}
                  color={theme.primaryText}
                />
              ))}
            </Picker>
          ) : (
            <ScrollView>
              {items.map((itemLabel, index) => (
                <TouchableOpacity key={index} style={styles.androidLabelWrap} onPress={() => onValueChange(index)}>
                  <Text
                    style={[
                      { ...styles.androidLabel, color: theme.primaryText },
                      index === selectedValue && styles.androidActiveLabel,
                    ]}>
                    {itemLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selectWrap: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  select: {
    height: 48,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  disableBorderBottom: {
    borderBottomWidth: 0,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modal: {
    margin: 0,
  },
  pickerWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 250,
    backgroundColor: '#fff',
  },
  pickerDone: {
    padding: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  pickerDoneText: {
    fontSize: 17,
    color: '#484C52',
  },

  androidLabelWrap: {
    paddingVertical: 9,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f1f1',
  },
  androidLabel: {
    fontSize: 18,
  },
  androidActiveLabel: {
    color: '#1F6BFF',
  },
})

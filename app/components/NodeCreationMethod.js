import React, { PureComponent } from 'react'
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import Modal from 'react-native-modal'
import ModalComponent from './Modal'
import { BluetoothIcon, QR, Gear, CreateIcon } from './svg'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class NodeCreationMethod extends PureComponent {
  state = {
    isModalStatus: 'hidden',
    isNodeCreation: false,
    network: null,
    isModalVisible: false,
  }

  toggleNodeCreation = () => {
    this.setState((prev) => ({ isNodeCreation: !prev.isNodeCreation }))
  }

  toggleModal = (isModalStatus = 'hidden') => {
    this.setState({ isModalStatus })
  }

  createNode = (method) => {
    const { navigation } = this.props
    const { network } = this.state

    this.toggleNodeCreation()

    switch (method) {
      case 'Adopted':
        navigation.navigate('AdoptedNodes', { networkId: network.id })
        break
      case 'BLE':
        navigation.navigate('BLESearch', { isNetworkAddNode: true })
        break
      case 'QR':
        navigation.navigate('CreateNodeQR', { network })
        break
      case 'Manual':
        navigation.navigate('NodeManual', { network, mode: 'manual', newNetwork: !!network })
        break
      default:
        navigation.navigate('NodeManual', { network, mode: 'create', newNetwork: !!network })
        break
    }
  }

  onModalHide = () => {
    if (this.state.isModalStatus === 'pending') {
      this.setState({
        isModalStatus: 'hidden',
      })
    }
  }

  showModal = (network) => {
    this.setState({ network }, this.toggleNodeCreation)
  }

  render() {
    const { isNodeCreation, isModalVisible } = this.state
    const { isAdoptedNodes, children } = this.props

    return (
      <>
        {React.cloneElement(children, {
          ref: () => {
            children.ref.current = { showModal: this.showModal }
          },
        })}

        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <>
              <Modal
                useNativeDriver
                hideModalContentWhileAnimating
                style={styles.modal}
                onModalHide={this.onModalHide}
                swipeDirection={['down']}
                isVisible={isNodeCreation}
                onSwipeComplete={this.toggleNodeCreation}
                onBackdropPress={this.toggleNodeCreation}>
                <View style={{ ...styles.modalContainer, backgroundColor: theme.primaryBackground }}>
                  {isAdoptedNodes && (
                    <TouchableOpacity style={styles.option} onPress={() => this.createNode('Adopted')}>
                      <CreateIcon focused size={24} />
                      <Text style={{ ...styles.optionTitle, color: theme.primaryText }}>
                        Move from existing network
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.option} onPress={() => this.createNode('BLE')}>
                    <BluetoothIcon focused size={24} />
                    <Text style={{ ...styles.optionTitle, color: theme.primaryText }}>Using Bluetooth</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.option} onPress={() => this.createNode('QR')}>
                    <QR />
                    <Text style={{ ...styles.optionTitle, color: theme.primaryText }}>Scan QR Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="NodeCreationMethodManually"
                    style={styles.option}
                    onPress={() => this.createNode('Manual')}>
                    <Gear />
                    <Text style={{ ...styles.optionTitle, color: theme.primaryText }}>Manually</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
              <ModalComponent title="Setup New Node" isModalVisible={isModalVisible} toggleModal={this.toggleModal} />
            </>
          )}
        </ManageThemeContext.Consumer>
      </>
    )
  }
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6D727A',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
})

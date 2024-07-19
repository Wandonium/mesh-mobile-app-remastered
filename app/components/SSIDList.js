import React, { PureComponent } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import Button from './Button'
import Modal from './Modal'
import UniversalItem from './UniversalItem'
import { CreateSSID } from '../containers'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class SSIDList extends PureComponent {
  state = {
    SSID: null,
    isModalVisible: false,
    securityList: ['WPA', 'WPA2', 'WPA/WPA2 Mixed Mode', 'WPA2 Enterprise', 'None'],
  }

  actionWithSSID = (order) => {
    Alert.alert(
      'Please select from the following',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            const SSID = this.props.network.ssid.find((ssid) => ssid.order === order)
            this.setState({ SSID, isModalVisible: true })
          },
        },
        {
          text: 'Delete',
          onPress: () => {
            const { deleteSSID, network } = this.props
            deleteSSID(network.id, order)
          },
        },
      ],
      { cancelable: false },
    )
  }

  toggleModal = () => {
    this.setState(
      (state) => ({ isModalVisible: !state.isModalVisible }),
      () => {
        setTimeout(() => {
          this.setState({ SSID: null })
        }, 200)
      },
    )
  }

  renderSSIDList = (ssids) =>
    ssids.map((ssid) => (
      <UniversalItem
        type="ssid"
        key={ssid.id.toString()}
        item={{ ...ssid, security: this.state.securityList[ssid.security] }}
        onPress={this.actionWithSSID}
      />
    ))

  isShowCaptivePortal = (ssids) =>
    !ssids.filter((el) => el.id !== this.state.SSID?.id).some((el) => el.captive_portal && el.captive_portal !== 'None')

  render() {
    const { isModalVisible, SSID } = this.state
    const { network } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            <View style={styles.ssidWrap}>
              {!!network.ssid && !!network.ssid.length && this.renderSSIDList(network.ssid)}
            </View>

            <View>
              {(!network.ssid || network.ssid.length < 4) && (
                <Button active text="Create SSID" onPress={this.toggleModal} />
              )}
              <Button text="Back" onPress={this.props.toggleModal} />
            </View>

            <Modal
              title={SSID ? 'Edit SSID' : 'Setup New SSID'}
              isModalVisible={isModalVisible}
              toggleModal={this.toggleModal}>
              <CreateSSID
                isShowCaptivePortal={this.isShowCaptivePortal(network.ssid)}
                SSID={SSID}
                networkId={network.id}
                toggleModal={this.toggleModal}
              />
            </Modal>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
  },
  ssidWrap: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
})

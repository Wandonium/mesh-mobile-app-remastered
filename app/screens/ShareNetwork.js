import React, { PureComponent } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { Button, FieldBG, DefaultHeaderHOC, SegmentedControlTab } from '../components'
import { validateEmail } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'
import { Close } from '../components/svg'

export default class ShareNetwork extends PureComponent {
  params = this.props.route.params

  state = {
    email: '',
    role: 'USER',
    isEmailValid: true,
    showModal: false,
  }

  toggleModal = () => {
    this.setState(state => ({ showModal: !state.showModal }))
  }

  changeData = (data, type) => {
    this.setState(state => ({ ...state, [type]: data }))
  }

  onRoleChange = index => {
    this.setState({ role: index === 0 ? 'USER' : 'OWNER' })
  }

  onPressAccept = async ({ networkId, email, role }) => {
    const { shareNetwork, navigation } = this.props
    await shareNetwork(networkId, { email, role }, navigation)
    this.toggleModal(false)
  }

  onPressCancel = () => {
    this.props.navigation.goBack(null)
  }

  renderButtons = () => {
    const { route } = this.props
    const { email, role } = this.state
    const networkId = route.params?.networkId ?? null
    return (
      <View style={styles.buttonsWrap}>
        <Button isRow text="Cancel" onPress={this.toggleModal} />
        <Button isRow active text="Accept" onPress={() => this.onPressAccept({ networkId, email, role })} />
      </View>
    )
  }

  renderConfirmSharingModal = () => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <Modal
          useNativeDriver
          hideModalContentWhileAnimating
          style={{ ...styles.bottomModal }}
          onSwipeComplete={() => this.setState({ showModal: false })}
          swipeDirection={['down']}
          isVisible={this.state.showModal}
          onBackdropPress={this.toggleModal}>
          <View style={{ ...styles.bottomModalContainer, backgroundColor: theme.primaryBackground }}>
            <View style={styles.modalTitleWrap}>
              <Text style={{ ...styles.modalTitle, color: theme.primaryText }}>Network will be shared</Text>
              <TouchableOpacity onPress={this.toggleModal}>
                <Close />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>Share network</Text>
            {this.renderButtons(true)}
          </View>
        </Modal>
      )}
    </ManageThemeContext.Consumer>
  )

  render() {
    const { navigation } = this.props
    const { isEmailValid, email, role } = this.state

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Share access" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              {this.renderConfirmSharingModal()}
              <View
                style={{
                  ...styles.emailContainer,
                  backgroundColor: theme.primaryCardBgr,
                  borderColor: theme.primaryBorder,
                }}>
                <FieldBG
                  label="User email"
                  keyboardType="email-address"
                  placeholder="Enter Email"
                  warningText={!isEmailValid ? 'Email is not correct' : null}
                  onChangeText={data => this.changeData(data, 'email')}
                />
              </View>
              <View
                style={{ ...styles.roleRow, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                <Text style={{ ...styles.label, color: theme.primaryText }}>Access level</Text>
                <View style={styles.roleTab}>
                  <SegmentedControlTab
                    values={['Viewer', 'Manager']}
                    selectedIndex={role === 'USER' ? 0 : 1}
                    onTabPress={this.onRoleChange}
                  />
                </View>
              </View>
              <View style={styles.buttonWrap}>
                <Button
                  active={email !== '' && validateEmail(email)}
                  disabled={email === '' || !validateEmail(email)}
                  text="Share"
                  onPress={() => this.toggleModal(true)}
                />
              </View>
            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F9FF',
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
    height: 60,

    paddingHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  roleTab: {
    width: 150,
  },
  emailContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    marginTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  buttonWrap: {
    marginTop: 16,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 32,
  },
  modalText: {
    fontSize: 16,
    color: '#666F7A',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  buttonsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
})

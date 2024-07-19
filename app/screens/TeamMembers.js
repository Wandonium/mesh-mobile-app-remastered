import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import Modal from 'react-native-modal'
import { Button, Field, Modal as ModalComponent, DefaultHeaderHOC } from '../components'
import { Edit, Delete } from '../components/svg'
import { AlertHelper } from '../services'
import { InviteTeamMember } from '../containers'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class TeamMembers extends PureComponent {
  state = {
    ITMVisible: false,
    isModalVisible: false,
    selectedUserId: null,
    selectedUserName: null,
    optionAction: null,
  }

  deleteUser = () => {
    this.props.deleteUser(this.state.selectedUserId)
    this.toggleModal()
  }

  editUserName = () => {
    const { selectedUserId, selectedUserName: name } = this.state
    if (name) {
      this.props.editUserName(selectedUserId, { name })
      this.toggleModal()
    } else {
      AlertHelper.alert('info', 'Alert', 'Name of the member can not be empty')
    }
  }

  toggleModal = (selectedUserId, selectedUserName) => {
    this.setState(prev => ({
      selectedUserId,
      selectedUserName,
      optionAction: null,
      isModalVisible: !prev.isModalVisible,
    }))
  }

  setOptionAction = optionAction => {
    this.setState({ optionAction })
  }

  changeUserName = selectedUserName => {
    this.setState({ selectedUserName })
  }

  toggleITM = () => {
    this.setState(state => ({ ITMVisible: !state.ITMVisible }))
  }

  renderButtons = (onPress, text) => (
    <View style={styles.buttonWrap}>
      <Button isRow text="Cancel" onPress={this.toggleModal} />
      <Button isRow active text={text} onPress={onPress} />
    </View>
  )

  renderOption = () => {
    const { selectedUserName, optionAction } = this.state
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => {
          switch (optionAction) {
            case 'edit':
              return (
                <KeyboardAvoidingView keyboardVerticalOffset={0} behavior={Platform.OS === 'ios' ? 'padding' : null}>
                  <View style={{ ...styles.content, backgroundColor: theme.primaryCardBgr }}>
                    <Field label="Name" value={selectedUserName} onChangeText={this.changeUserName} />
                    {this.renderButtons(this.editUserName, 'Save')}
                  </View>
                </KeyboardAvoidingView>
              )

            case 'delete':
              return (
                <View style={{ ...styles.content, backgroundColor: theme.primaryCardBgr }}>
                  <Text numberOfLines={1} style={{ ...styles.subTitle, color: theme.primaryText }}>
                    Delete team member?
                  </Text>
                  <Text style={styles.deleteText}>
                    Are you sure that you want to remove access for {selectedUserName} when you log in to Mesh++
                  </Text>

                  {this.renderButtons(this.deleteUser, 'Delete')}
                </View>
              )

            default:
              return (
                <View style={{ ...styles.content, backgroundColor: theme.primaryCardBgr }}>
                  <Text numberOfLines={1} style={{ ...styles.subTitle, color: theme.primaryText }}>
                    {selectedUserName}
                  </Text>
                  <TouchableOpacity
                    style={{ ...styles.action, borderColor: theme.primaryBorder }}
                    onPress={() => this.setOptionAction('edit')}>
                    <Edit size={24} />
                    <Text style={{ ...styles.actionText, color: theme.primaryText }}>Edit name</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ ...styles.action, borderColor: theme.primaryBorder }}
                    onPress={() => this.setOptionAction('delete')}>
                    <Delete size={24} />
                    <Text style={{ ...styles.actionText, color: theme.primaryText }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )
          }
        }}
      </ManageThemeContext.Consumer>
    )
  }

  renderOptionsModal = () => {
    return (
      <Modal
        useNativeDriver
        hideModalContentWhileAnimating
        style={styles.modal}
        onSwipeComplete={this.toggleModal}
        onBackdropPress={this.toggleModal}
        swipeDirection={['down']}
        isVisible={this.state.isModalVisible}>
        {this.renderOption()}
      </Modal>
    )
  }

  render() {
    const { ITMVisible } = this.state
    const { navigation, team } = this.props
    console.log('[TeamMembers.js] - team', team[0].emails[0].email)
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Team Members" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View style={styles.flex}>
                {team && team.length && (
                  <FlatList
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ ...styles.contentContainer, borderColor: theme.primaryBorder }}
                    data={team}
                    renderItem={({ item: { name, emails, id } }) => (
                      <TouchableOpacity onPress={() => this.toggleModal(id, name)} style={{ ...styles.item, backgroundColor: theme.primaryCardBgr }}>
                        <Text style={{ ...styles.userName, color: theme.primaryText }}>{name}</Text>
                        <Text style={styles.userEmail}>{emails[0].email}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => (
                      <View style={{ ...styles.separator, backgroundColor: theme.primaryBackground }} />
                    )}
                  />
                )}
              </View>

              <View style={styles.buttonInviteWrap}>
                <Button active text="Invite" onPress={this.toggleITM} />
              </View>

              {this.renderOptionsModal()}

              <ModalComponent title="Invite Team Member" isModalVisible={ITMVisible} toggleModal={this.toggleITM}>
                {ITMVisible && <InviteTeamMember toggleModal={this.toggleITM} />}
              </ModalComponent>
            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    flex: 1,
    // backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
  },
  content: {
    // backgroundColor: 'white',
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor: '#E6ECF5',
  },
  subTitle: {
    marginVertical: 12,
    fontSize: 22,
    // color: '#101114',
  },
  item: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userName: {
    // color: '#101114',
    fontSize: 16,
  },
  userEmail: {
    color: '#8F97A3',
    fontSize: 12,
    marginTop: 3,
  },
  separator: {
    height: 1,
    // backgroundColor: '#E6ECF5',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  action: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    // borderColor: '#E6ECF5',
  },
  actionText: {
    fontSize: 18,
    marginLeft: 24,
    color: '#101114',
  },
  buttonWrap: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: -8,
  },
  buttonInviteWrap: {
    marginTop: 20,
  },
  deleteText: {
    color: '#6D727A',
    fontSize: 16,
  },
})

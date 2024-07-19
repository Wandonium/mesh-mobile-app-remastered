/* eslint-disable no-nested-ternary */
import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, Keyboard, TouchableWithoutFeedback, FlatList } from 'react-native'
import Button from './Button'
import FieldBG from './FieldBG'
import UniversalItem from './UniversalItem'
import Switch from './Switch'
import SegmentedControlTab from './SegmentedControlTab'
import { validateEmail } from '../services'
import api from '../config/api'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class InviteTeamMember extends PureComponent {
  state = {
    networks: this.props.data,
    selectedNetworksIds: [],
    email: '',
    url: `${api.siteUrl}/signup/`,
    isEmailValid: true,
    isSelectedAllNetworks: true,
    allRoles: 0,
    userAccess: 0,
  }

  changeData = (data, type) => {
    this.setState((state) => ({ ...state, [type]: data }))
  }

  toggleAllNetworks = (value) => {
    const selectedNetworksIds = []
    this.setState((state) => {
      const networks = state.networks.map((item) => {
        item.isSelected = value
        item.role = state.allRoles
        if (value) selectedNetworksIds.push({ id: item.id, role: state.allRoles === 0 ? 'USER' : 'OWNER' })
        return item
      })
      return { networks, selectedNetworksIds, isSelectedAllNetworks: value }
    })
  }

  toggleAllRoles = (value) => {
    this.setState({ allRoles: value }, () => {
      if (this.state.isSelectedAllNetworks) this.toggleAllNetworks(true)
    })
  }

  changeUserAccess = (value) => {
    this.setState({ userAccess: value, isSelectedAllNetworks: true }, () => {
      if (this.state.userAccess === 1) this.toggleAllRoles(1)
      if (this.state.userAccess === 0) this.toggleAllRoles(0)
    })
  }

  switchNetwork = (networkId, isSelected, role = 'USER') => {
    console.log('[InviteTeamMember.js] - switchNetwork', isSelected)
    const selectedNetworksIds = [...this.state.selectedNetworksIds]

    if (!isSelected) selectedNetworksIds.push({ id: networkId, role })
    else selectedNetworksIds.splice(selectedNetworksIds.indexOf(networkId), 1)

    const networks = this.state.networks.map((el) =>
      el.id === networkId ? { ...el, isSelected: !el.isSelected, role: role !== 'USER' ? 1 : 0 } : el,
    )

    this.setState({ networks, selectedNetworksIds, isSelectedAllNetworks: false })
  }

  sendAnInvite = () => {
    const { email, url, selectedNetworksIds, userAccess } = this.state
    const role = userAccess === 2 ? 'OWNER' : userAccess === 1 ? 'MANAGER' : 'USER'
    const accessNetworks = {}
    selectedNetworksIds.forEach((network) => {
      accessNetworks[network.id] = network.role
    })

    this.setState({ isEmailValid: validateEmail(email) }, () => {
      if (this.state.isEmailValid) {
        const { inviteTeamMember, toggleModal } = this.props
        inviteTeamMember({ email, url, networks: JSON.stringify(accessNetworks), role })
        toggleModal()
      }
    })
  }

  onRoleChange = (id, index) => {
    const selectedNetworksIds = [...this.state.selectedNetworksIds]
    selectedNetworksIds.find((x) => x.id === id).role = index === 0 ? 'USER' : 'OWNER'
    const networks = this.state.networks.map((el) => (el.id === id ? { ...el, role: index } : el))

    this.setState({ networks, selectedNetworksIds })
  }

  render() {
    const { networks, email, isEmailValid, selectedNetworksIds, allRoles, userAccess } = this.state
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground}}>
              <View style={{ ...styles.emailContainer, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
                <FieldBG
                  label="Team member email"
                  keyboardType="email-address"
                  placeholder="Enter Email"
                  warningText={!isEmailValid ? 'Email is not correct' : null}
                  onChangeText={(data) => this.changeData(data, 'email')}
                />
              </View>

              <Text style={{ ...styles.sectionTitle, color: theme.primaryText }}>User Role</Text>
              <View style={{ ...styles.accessContainer, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
                <View style={styles.roleTab}>
                  <SegmentedControlTab
                    values={['Viewer', 'Manager', 'Administrator']}
                    selectedIndex={userAccess}
                    onTabPress={this.changeUserAccess}
                  />
                </View>
              </View>

              {userAccess !== 2 && (
                <>
                  <Text style={{ ...styles.sectionTitle, color: theme.primaryText }}>Networks access</Text>
                  <View style={{ ...styles.switchContainer, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
                    <View style={styles.allRolesTab}>
                      <SegmentedControlTab
                        values={['Viewer', 'Manager']}
                        selectedIndex={allRoles}
                        onTabPress={this.toggleAllRoles}
                      />
                    </View>
                    <Switch
                      label="All networks"
                      value={this.state.isSelectedAllNetworks}
                      onValueChange={(value) => this.toggleAllNetworks(value)}
                    />
                  </View>

                  <FlatList
                    contentContainerStyle={styles.networkContainer}
                    keyExtractor={(item) => item.id.toString()}
                    data={networks}
                    renderItem={({ item: { isSelected=true, role = 0, ...network } }) => (
                      <View onStartShouldSetResponder={() => true}>
                        <UniversalItem
                          isShowSwitch
                          isInvite
                          key={network.id.toString()}
                          item={network}
                          value={isSelected}
                          role={role}
                          onRoleChange={(index) => this.onRoleChange(network.id, index)}
                          onValueChange={(id) => this.switchNetwork(id, isSelected)}
                        />
                      </View>
                    )}
                  />
                </>
              )}
              <View style={styles.buttonWrap}>
                <Button
                  active={email !== '' && selectedNetworksIds.length}
                  disabled={email === '' || !selectedNetworksIds.length}
                  text="Send an invite"
                  onPress={this.sendAnInvite}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
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
  emailContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    marginTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 12,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  switchContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  accessContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  networkContainer: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  buttonWrap: {
    marginTop: 16,
  },
  allRolesTab: {
    position: 'absolute',
    width: 140,
    top: 16,
    right: 86,
    zIndex: 1000,
  },
})

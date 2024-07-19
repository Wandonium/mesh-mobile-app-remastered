import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Field, SelectBox, StackHeader, Switch } from '../components'
import { keychain } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class MyProfile extends PureComponent {
  state = {
    name: '',
    biometryType: null,
    useBiometry: false,
  }

  async componentDidMount() {
    const biometryType = await keychain.getSupportedBiometryType()
    const useBiometry = await keychain.isUseBiometry()
    this.setState({ biometryType, useBiometry })

    this.updateUserName()
    this.props.navigation.addListener('focus', this.updateUserName)
  }

  updateUserName = () => {
    this.setState({ name: this.props.user.name })
  }

  logout = () => {
    Alert.alert(
      'Warning',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            const { logout, navigation } = this.props
            logout(navigation)
          },
        },
      ],
      { cancelable: false },
    )
  }

  navigateTo = (route) => {
    this.props.navigation.navigate(route)
  }

  changeData = (dataName, value) => {
    this.setState({ [dataName]: value })
  }

  changeUserData = () => {
    const { name } = this.state
    this.props.changeUserData({ name })
  }

  toggleBiometry = async (useBiometry) => {
    await AsyncStorage.setItem('useBiometry', useBiometry.toString())
    this.setState({ useBiometry })
  }

  render() {
    const { name, biometryType, useBiometry } = this.state
    const { canTeam, user } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ mode, theme, toggle }) => (
          <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            <ScrollView contentContainerStyle={{ ...styles.scrollView, color: theme.primaryText }}>
              <View>
                <StackHeader
                  testID="MyProfileSave"
                  title={name ? (name.length < 16 ? name : `${name.substr(0, 16)}...`) : 'Profile'}
                  buttonText="Save"
                  showButton
                  textColor={theme.primaryText}
                  onPress={this.changeUserData}
                />

                <Text style={{ ...styles.sectionTitle, color: theme.primaryLightGray }}>Preferences</Text>
                <View
                  style={{
                    ...styles.section,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <View style={styles.fieldWrap}>
                    <Field
                      testID="MyProfileName"
                      label="Full Name"
                      placeholder="Enter user name"
                      value={name}
                      onChangeText={(text) => this.changeData('name', text)}
                    />
                  </View>

                  <SelectBox title="Email" subTitle={user.email} onPress={() => this.navigateTo('ChangeUserEmail')} />
                  <SelectBox
                    disableBorderBottom={!biometryType}
                    title="Change password"
                    onPress={() => this.navigateTo('ChangeUserPassword')}
                  />
                  {biometryType && (
                    <View style={styles.fieldWrap}>
                      <Switch
                        label={`Use ${biometryType}`}
                        value={useBiometry}
                        onValueChange={(value) => this.toggleBiometry(value)}
                      />
                    </View>
                  )}
                </View>
                {canTeam && (
                  <>
                    <Text style={{ ...styles.sectionTitle, color: theme.primaryLightGray }}>Team</Text>
                    <View
                      style={{
                        ...styles.section,
                        backgroundColor: theme.primaryCardBgr,
                        borderColor: theme.primaryBorder,
                      }}>
                      <SelectBox
                        disableBorderBottom
                        title="Team members"
                        onPress={() => this.navigateTo('TeamMembers')}
                      />
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={{ ...styles.button, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}
                onPress={this.logout}>
                <Text style={styles.buttonText}>Log out</Text>
              </TouchableOpacity>
              <View style={styles.toggleThemeSwitcher}>
                <Switch
                  style={{ color: theme.primaryText }}
                  label={mode === 'light' ? 'Dark theme' : 'Dark theme'}
                  value={mode === 'dark'}
                  onValueChange={() => toggle(mode)}
                />
              </View>
            </ScrollView>
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
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  section: {
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor: '#E6ECF5',
  },
  fieldWrap: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  button: {
    height: 48,
    marginTop: 40,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor: '#E6ECF5',
  },
  buttonText: {
    color: '#EB4E4D',
    fontSize: 16,
  },
  toggleThemeSwitcher: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
})

import React, { Component } from 'react'
import { StyleSheet, View, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import { AlertHelper } from '../services'
import { Button, Field, DefaultHeaderHOC } from '../components'
import { ManageThemeContext } from '../theme/ThemeManager'
import { HideEye, ShowEye } from '../components/svg'

export default class ChangeUserPassword extends Component {
  state = {
    password: '',
    new_password: '',
    confirm_password: '',
    secureTextEntry: [true, true, true],
  }

  toggleSecurePassword = order => {
    const { secureTextEntry } = this.state
    secureTextEntry[order] = !secureTextEntry[order]
    this.setState(() => ({
      secureTextEntry,
    }))
  }

  changeData = (dataName, value) => {
    this.setState({ [dataName]: value })
  }

  changePassword = () => {
    const { password, new_password, confirm_password } = this.state

    if (new_password === confirm_password) {
      const { navigation, changePassword } = this.props
      changePassword(navigation, { password, new_password })
    } else {
      AlertHelper.alert('error', 'Error', 'New password does not match')
    }
  }

  toggleSecureTextEntry = index => {
    const { secureTextEntry } = this.state
    secureTextEntry[index] = !secureTextEntry[index]
    this.setState({ secureTextEntry })
  }

  render() {
    const { secureTextEntry } = this.state

    return (
      <ManageThemeContext>
        {({ theme }) => (
          <DefaultHeaderHOC title="Change Password" navigation={this.props.navigation}>
            <KeyboardAvoidingView
              behavior="padding"
              style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View
                style={{ ...styles.content, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                <Field
                  secureTextEntry={secureTextEntry[0]}
                  toggleSecureTextEntry={() => this.toggleSecureTextEntry(0)}
                  label="Current password"
                  placeholder="Enter your current password"
                  onChangeText={text => this.changeData('password', text)}
                  icon={
                    <View>
                      <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntry(0)}>
                        {secureTextEntry[0] ? <HideEye /> : <ShowEye />}
                      </TouchableOpacity>
                    </View>
                  }
                />
                <Field
                  secureTextEntry={secureTextEntry[1]}
                  toggleSecureTextEntry={() => this.toggleSecureTextEntry(1)}
                  label="New password"
                  placeholder="Enter new password"
                  onChangeText={text => this.changeData('new_password', text)}
                  icon={
                    <View>
                      <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntry(1)}>
                        {secureTextEntry[1] ? <HideEye /> : <ShowEye />}
                      </TouchableOpacity>
                    </View>
                  }
                />
                <Field
                  secureTextEntry={secureTextEntry[2]}
                  toggleSecureTextEntry={() => this.toggleSecureTextEntry(2)}
                  disableBorderBottom
                  label="Confirm password"
                  placeholder="Repeat your new password"
                  onChangeText={text => this.changeData('confirm_password', text)}
                  icon={
                    <View>
                      <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntry(2)}>
                        {secureTextEntry[2] ? <HideEye /> : <ShowEye />}
                      </TouchableOpacity>
                    </View>
                  }
                />
              </View>

              <Button active text="Save" onPress={this.changePassword} />
            </KeyboardAvoidingView>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
})

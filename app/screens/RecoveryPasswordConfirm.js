import React, { PureComponent } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native'
import { FieldBG, Button } from '../components'
import { Logo } from '../components/svg'
import { validatePassword } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class RecoveryPasswordConfirm extends PureComponent {
  state = {
    form: {
      password: '',
      confirm_password: '',
    },
    isHiddenPassword: true,
    isHiddenConfirmPassword: true,
    isPasswordValid: true,
    isPasswordsEqual: true,
  }

  managePasswordVisibility = (data, type) => {
    this.setState(state => ({ ...state, [type]: data }))
  }

  changeFormData = (data, type) => {
    this.setState(state => ({ form: { ...state.form, [type]: data } }))
  }

  registerConfirm = () => {
    const { password, confirm_password } = this.state.form
    isPasswordValid = true
    isPasswordsEqual = true

    if (!validatePassword(this.state.form.password)) {
      isPasswordValid = false
    }

    if (password != confirm_password) {
      isPasswordsEqual = false
    }

    this.setState({ isPasswordValid, isPasswordsEqual }, () => {
      if (isPasswordValid && isPasswordsEqual) {
        const { confirmRecoveryPassword, navigation, route } = this.props
        confirmRecoveryPassword(navigation, this.state.form, route.params?.token)
      }
    })
  }

  render() {
    const { isHiddenPassword, isHiddenConfirmPassword, isPasswordValid, isPasswordsEqual } = this.state
    const { password, confirm_password } = this.state.form

    return (
      <ManageThemeContext>
        {({ theme }) => (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.flex}>
            <SafeAreaView style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.flex}>
                  <View style={styles.header}>
                    <Logo />
                  </View>

                  <View style={styles.content}>
                    <Text style={{ ...styles.title, color: theme.primaryText }}>Reset password</Text>
                    <FieldBG
                      label="New password"
                      textContentType="newPassword"
                      placeholder="Enter new password"
                      isSecure
                      secureTextEntry={isHiddenPassword}
                      warningText={
                        !isPasswordValid
                          ? 'Password should contain at least 1 uppercase symbol 1 number and be more than 8 symbols'
                          : null
                      }
                      toggleSecureTextEntry={() => {
                        this.managePasswordVisibility(!isHiddenPassword, 'isHiddenPassword')
                      }}
                      onChangeText={data => this.changeFormData(data, 'password')}
                    />

                    <FieldBG
                      label="Confirm new password"
                      textContentType="newPassword"
                      placeholder="Re-enter new password"
                      isSecure
                      secureTextEntry={isHiddenConfirmPassword}
                      warningText={!isPasswordsEqual ? 'Passwords are not equal' : null}
                      toggleSecureTextEntry={() => {
                        this.managePasswordVisibility(!isHiddenConfirmPassword, 'isHiddenConfirmPassword')
                      }}
                      onChangeText={data => this.changeFormData(data, 'confirm_password')}
                    />

                    <View style={styles.buttonWrap}>
                      <Button
                        active={password != '' && confirm_password != ''}
                        disabled={password == '' || confirm_password == ''}
                        text="Reset password"
                        onPress={this.registerConfirm}
                      />
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </SafeAreaView>
          </KeyboardAvoidingView>
        )}
      </ManageThemeContext>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 3,
  },
  title: {
    fontSize: 32,
    height: 42,
    marginHorizontal: 16,
    marginTop: -16,
  },
  buttonWrap: {
    marginTop: 32,
  },
  flex: {
    flex: 1,
  },
})

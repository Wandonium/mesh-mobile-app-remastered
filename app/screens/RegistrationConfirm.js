import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, SafeAreaView, Platform } from 'react-native'
import { FieldBG } from '../components'
import { Logo } from '../components/svg'
import { validatePassword } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class RegistrationConfirm extends PureComponent {
  state = {
    form: {
      username: '',
      password: '',
      confirm_password: '',
    },
    isHiddenPassword: true,
    isHiddenConfirmPassword: true,
    isPasswordsEqual: true,
    isPasswordValid: true,
  }

  toLogIn = () => {
    this.props.navigation.navigate('Login')
  }

  managePasswordVisibility = (data, type) => {
    this.setState(state => ({ ...state, [type]: data }))
  }

  changeFormData = (data, type) => {
    this.setState(state => ({ form: { ...state.form, [type]: data } }))
  }

  registerConfirm = () => {
    const { password, confirm_password } = this.state.form

    isPasswordsEqual = true
    isPasswordValid = true

    if (!validatePassword(password)) {
      isPasswordValid = false
    }

    if (password != confirm_password) {
      isPasswordsEqual = false
    }

    this.setState({ isPasswordsEqual, isPasswordValid }, () => {
      if (isPasswordsEqual && isPasswordValid) {
        const { registerConfirm, navigation, route } = this.props
        registerConfirm(navigation, this.state.form, route.params?.token)
      }
    })
  }

  render() {
    const { isHiddenPassword, isHiddenConfirmPassword, isPasswordsEqual, isPasswordValid } = this.state
    const { username, password, confirm_password } = this.state.form

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
            <SafeAreaView>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
                <View style={styles.header}>
                  <Logo />
                </View>

                <View style={styles.content}>
                  <Text style={styles.title}>Sign up</Text>

                  <FieldBG
                    label="Username"
                    placeholder="Enter username"
                    value={username}
                    onChangeText={data => this.changeFormData(data, 'username')}
                  />

                  <FieldBG
                    label="Password"
                    textContentType="password"
                    autoCompleteType="password"
                    placeholder="Enter password"
                    isSecure
                    warningText={
                      !isPasswordValid
                        ? 'Password should contain at least 1 uppercase symbol 1 number and be more than 8 symbols'
                        : null
                    }
                    secureTextEntry={isHiddenPassword}
                    toggleSecureTextEntry={() => {
                      this.managePasswordVisibility(!isHiddenPassword, 'isHiddenPassword')
                    }}
                    onChangeText={data => this.changeFormData(data, 'password')}
                  />

                  <FieldBG
                    label="Confirm password"
                    placeholder="Enter confirm password"
                    isSecure
                    warningText={!isPasswordsEqual ? 'Passwords are not equal' : null}
                    secureTextEntry={isHiddenConfirmPassword}
                    toggleSecureTextEntry={() => {
                      this.managePasswordVisibility(!isHiddenConfirmPassword, 'isHiddenConfirmPassword')
                    }}
                    onChangeText={data => this.changeFormData(data, 'confirm_password')}
                  />

                  <View style={styles.buttonWrap}>
                    <Button
                      active={username !== '' && password !== '' && confirm_password !== ''}
                      disabled={username === '' || password === '' || confirm_password === ''}
                      text="Sign up"
                      onPress={this.registerConfirm}
                    />
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    alignSelf: 'flex-start',
    marginHorizontal: 16,
  },
  buttonWrap: {
    marginTop: 32,
  },
  linkText: {
    fontSize: 16,
    alignSelf: 'center',
    color: '#1F6BFF',
    lineHeight: 22,
  },
  scroll: {
    minHeight: '100%',
  },
})

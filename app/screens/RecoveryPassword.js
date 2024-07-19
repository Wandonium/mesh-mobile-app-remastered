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
  TouchableOpacity,
} from 'react-native'
import { Button, FieldBG } from '../components'
import { Logo } from '../components/svg'
import { validateEmail } from '../services'
import api from '../config/api'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class RecoveryPassword extends PureComponent {
  state = {
    form: {
      email: '',
      url: `${api.siteUrl}/forgotpassword/`,
    },
    isEmailValid: true,
  }

  toLogIn = () => {
    this.props.navigation.navigate('Login')
  }

  changeFormData = data => {
    this.setState(state => ({ form: { ...state.form, email: data } }))
  }

  sendRecoveryLink = () => {
    if (!validateEmail(this.state.form.email)) {
      this.setState({ isEmailValid: false })
      return
    }

    this.setState({ isEmailValid: true })
    this.props.recoveryPassword(this.state.form)
  }

  render() {
    const { isEmailValid, form } = this.state

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <SafeAreaView style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.flex}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.flex}>
                  <View style={styles.header}>
                    <Logo />
                  </View>

              <View style={styles.content}>
                <Text style={{ ...styles.title, color: theme.primaryText }}>Reset password</Text>

                <FieldBG
                  value={form.email}
                  label="Email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoCompleteType="email"
                  placeholder="Enter Email"
                  warningText={!isEmailValid ? 'Email is not correct' : null}
                  onChangeText={data => this.changeFormData(data, 'email')}
                />

                    <View style={styles.buttonWrap}>
                      <Button
                        active={form.email != ''}
                        disabled={form.email == ''}
                        text="Send recovery link"
                        onPress={this.sendRecoveryLink}
                      />
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            <TouchableOpacity style={styles.bottomLink} onPress={this.toLogIn}>
              <Text style={styles.bottomLinkText}>SignIn</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </ManageThemeContext.Consumer>
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
  bottomLink: {
    marginVertical: 55,
    alignSelf: 'center',
  },
  bottomLinkText: {
    fontSize: 16,
    alignSelf: 'center',
    color: '#1F6BFF',
    lineHeight: 22,
  },
  flex: {
    flex: 1,
  },
})

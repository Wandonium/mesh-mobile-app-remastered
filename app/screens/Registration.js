import React, { PureComponent } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native'
import { Button, FieldBG } from '../components'
import { Logo } from '../components/svg'
import { validateEmail } from '../services'
import api from '../config/api'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class Registration extends PureComponent {
  state = {
    form: {
      name: '',
      email: '',
      url: `${api.siteUrl}/signup/`,
    },
    isEmailValid: true,
  }

  toLogIn = () => {
    this.props.navigation.navigate('Login')
  }

  changeFormData = (data, type) => {
    this.setState((state) => ({ form: { ...state.form, [type]: data } }))
  }

  register = () => {
    if (!validateEmail(this.state.form.email)) {
      this.setState({ isEmailValid: false })
      return
    }

    this.setState({ isEmailValid: true })
    this.props.register(this.state.form)
  }

  render() {
    const { name, email } = this.state.form
    const { isEmailValid } = this.state

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
                    <Text style={{ ...styles.title, color: theme.primaryText }}>Sign up</Text>

                    <FieldBG
                      label="Company name"
                      placeholder="Enter Company name"
                      onChangeText={(data) => this.changeFormData(data, 'name')}
                    />

                    <FieldBG
                      label="Email"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoCompleteType="email"
                      placeholder="Enter Email"
                      warningText={!isEmailValid ? 'Email is not correct' : null}
                      onChangeText={(data) => this.changeFormData(data, 'email')}
                    />

                    <View style={styles.buttonWrap}>
                      <Button
                        active={email != '' && name != ''}
                        disabled={name == '' || email == ''}
                        text="Register"
                        onPress={this.register}
                      />
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            <TouchableOpacity style={styles.bottomLink} onPress={this.toLogIn}>
              <Text style={styles.bottomLinkText}>Already have an account? Sign in</Text>
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
    backgroundColor: '#fff',
    justifyContent: 'space-between',
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
    lineHeight: 42,
    marginHorizontal: 16,
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

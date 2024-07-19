import React, { PureComponent } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
} from 'react-native'
import { Button, FieldBG } from '../components'
import { Logo } from '../components/svg'
import { validateEmail, urlHandler, keychain } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class Login extends PureComponent {
  state = {
    form: {
      email: '',
      password: '',
    },
    isHiddenPassword: true,
    isEmailValid: true,
  }

  async componentDidMount() {
    console.log('[Login.js] - componentDidMount')
    if (await keychain.isUseBiometry()) {
      console.log('[Login.js] - componentDidMount 1')
      const userCredentials = await keychain.getGenericPassword()

      if (userCredentials) {
        const { login, navigation } = this.props

        login(navigation, { email: userCredentials.username, password: userCredentials.password })
      }
    }
    console.log('[Login.js] - componentDidMount 2', this.state.form)
    urlHandler.subscribe(cb => {
      
      const { navigation, route } = this.props
      const [_, type, token] = cb
      let blockListener = Platform.OS === 'ios' ? false : route.params?.blockListener

      if (!blockListener) {
        blockListener = false

        switch (type) {
          case 'signup':
            navigation.navigate('RegistrationConfirm', { token })
            break
          case 'forgotpassword':
            navigation.navigate('RecoveryPasswordConfirm', { token })
            break
        }
      }
    })
  }

  componentWillUnmount() {
    urlHandler.unsubscribe()
  }

  managePasswordVisibility = () => {
    this.setState(state => ({ isHiddenPassword: !state.isHiddenPassword }))
  }

  changeFormData = (data, type) => {
    this.setState(state => ({ form: { ...state.form, [type]: data } }))
  }

  login = async () => {
    console.log('[Login.js] - login')
    const { email } = this.state.form
    const isEmailValid = validateEmail(email)
    console.log('[Login.js] - login')
    this.setState(() => ({ isEmailValid }))
    if (isEmailValid) {
      const { form } = this.state
      const { login, navigation } = this.props
      await login(navigation, form)
    }
  }

  navigateTo = route => {
    const { navigation } = this.props
    navigation.navigate(route)
  }

  render() {
    const { isHiddenPassword, isEmailValid } = this.state
    const { email, password } = this.state.form

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <SafeAreaView testID="Login" style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.flex}>
                <View style={styles.header}>
                  <Logo />
                </View>

                <View style={styles.content}>
                  <Text style={{ ...styles.title, color: theme.primaryText }}>Log in</Text>

                  <FieldBG
                    testID="LoginEmail"
                    label="Email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCompleteType="email"
                    placeholder="Enter Email"
                    warningText={!isEmailValid ? 'Email is not correct' : null}
                    onChangeText={data => this.changeFormData(data, 'email')}
                  />

                  <FieldBG
                    testID="LoginPassword"
                    label="Password"
                    textContentType="password"
                    autoCompleteType="password"
                    placeholder="Enter password"
                    isSecure
                    secureTextEntry={isHiddenPassword}
                    toggleSecureTextEntry={this.managePasswordVisibility}
                    onChangeText={data => this.changeFormData(data, 'password')}
                  />

                  <View style={styles.buttonWrap}>
                    <Button
                      testID="LoginButton"
                      active={email !== '' && password !== ''}
                      disabled={email === '' || password === ''}
                      text="Sign in"
                      onPress={this.login}
                    />
                  </View>

                  <TouchableOpacity onPress={() => this.navigateTo('RecoveryPassword')}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </TouchableOpacity>
                  <View style={styles.flex} />
                </View>
              </View>
            </TouchableWithoutFeedback>
            <TouchableOpacity style={styles.registration} onPress={() => this.navigateTo('Registration')}>
              <Text style={styles.linkText}>Create Mesh++ account</Text>
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
  registration: {
    marginVertical: 55,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 16,
    alignSelf: 'center',
    color: '#1F6BFF',
    lineHeight: 22,
  },
  flex: {
    flex: 1,
  },
})

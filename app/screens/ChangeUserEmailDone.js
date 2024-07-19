import React, { PureComponent } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button, Field, DefaultHeaderHOC } from '../components'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class ChangeUserEmail extends PureComponent {
  state = {
    code: '',
  }

  changeData = (dataName, value) => {
    this.setState({ [dataName]: value })
  }

  sendCode = () => {
    const { navigation, route, sendEmailCode } = this.props
    sendEmailCode(navigation, this.state.code, route.params?.body)
  }

  render() {
    const { navigation } = this.props
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View style={styles.content}>
                <Text style={{ ...styles.title, color: theme.primaryText }}>Edit Email</Text>
                <Text style={styles.text}>The code has been sent to your email</Text>

                <Field
                  label="Code"
                  placeholder="Enter your code"
                  onChangeText={text => this.changeData('code', text)}
                />
              </View>

              <Button active text="Send code" onPress={this.sendCode} />
            </View>
          </DefaultHeaderHOC>
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
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    marginTop: 10,
    marginBottom: 26,
  },
  text: {
    marginBottom: 16,
    fontSize: 16,
    color: '#666F7A',
  },
})

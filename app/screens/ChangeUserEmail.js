import React, { PureComponent } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button, Field, DefaultHeaderHOC } from '../components'
import { validateEmail, AlertHelper } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class ChangeUserEmail extends PureComponent {
  state = {
    email: '',
  }

  changeData = (value) => {
    this.setState({ email: value })
  }

  changeEmail = () => {
    const { email } = this.state
    if (validateEmail(email)) {
      const { navigation, changeEmail } = this.props
      changeEmail(navigation, { email })
    } else {
      console.log('[validate.js] - email validation failed', email)
      AlertHelper.alert('error', 'Error', 'Please input your valid Email address')
    }
  }

  render() {
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Edit Email" navigation={this.props.navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View>
                <Text style={{ ...styles.text, color: theme.primaryLightGray }}>
                  Enter your new email where you'll receive notifications and which will be used for login to Mesh++
                </Text>
                <Text style={{ ...styles.text, color: theme.primaryLightGray }}>
                  We’ll send you an email to confirm your new email address
                </Text>

                <View
                  style={{
                    ...styles.fieldWrap,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <Field
                    disableBorderBottom
                    label="New Email"
                    placeholder="Enter your new email"
                    onChangeText={text => this.changeData(text)}
                  />
                </View>
              </View>

              <Button active text="Save" onPress={this.changeEmail} />
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
  text: {
    padding: 16,
    paddingBottom: 0,
    fontSize: 16,
  },
  fieldWrap: {
    marginTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
})

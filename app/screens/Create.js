import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { NodeCreationMethod, StackHeader } from '../components'
import { Internet, Node } from '../components/svg'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class Create extends PureComponent {
  _nodeButton = React.createRef()

  toCreateNetwork = () => {
    this.props.navigation.navigate('CreateNetwork')
  }

  toggleNodeCreation = () => {
    this._nodeButton.current.showModal()
  }

  render() {
    const { navigation, isAdmin } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => {
          return !isAdmin ? (
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <StackHeader title="Setup new..." />

              <View style={styles.content}>
                <TouchableOpacity
                  testID="CreateNetwork"
                  style={{ ...styles.button, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}
                  onPress={this.toCreateNetwork}>
                  <Internet />
                  <Text style={{ ...styles.buttonTitle, color: theme.primaryText }}>Network</Text>
                </TouchableOpacity>

                <NodeCreationMethod navigation={navigation}>
                  <TouchableOpacity
                    testID="CreateNode"
                    ref={this._nodeButton}
                    style={{
                      ...styles.button,
                      backgroundColor: theme.primaryCardBgr,
                      borderColor: theme.primaryBorder,
                    }}
                    onPress={this.toggleNodeCreation}>
                    <Node />
                    <Text style={{ ...styles.buttonTitle, color: theme.primaryText }}>Node</Text>
                  </TouchableOpacity>
                </NodeCreationMethod>
              </View>
            </View>
          ) : (
            <View style={styles.prohibitionWrap}>
              <Text style={styles.prohibition}>{'Admin user level needed\nContact your company owner'}</Text>
            </View>
          )
        }}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F5F9FF',
  },
  content: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  button: {
    height: 94,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6ECF5',
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#101114',
  },
  prohibitionWrap: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  prohibition: {
    marginTop: 50,
    marginBottom: 25,
    color: '#101114',
    fontSize: 20,
    textAlign: 'center',
  },
})

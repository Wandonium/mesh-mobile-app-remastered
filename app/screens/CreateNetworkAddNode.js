import React, { Component } from 'react'
import { StyleSheet, View, Alert, FlatList } from 'react-native'
import { Button, NodeCreationMethod, UniversalItem, DefaultHeaderHOC } from '../components'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class CreateNetworkAddNode extends Component {
  _nodeButton = React.createRef()

  toggleNodeCreation = () => {
    this._nodeButton.current.showModal(this.props.network)
  }

  selectNode = () => {
    const { navigation, network } = this.props
    navigation.navigate('AdoptedNodes', { networkId: network.id })
  }

  goBack = () => {
    this.props.navigation.goBack(null)
  }

  actionWithNode = (id, networkId) => {
    Alert.alert(
      'Warning',
      'Please, select action with node',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Edit',
          onPress: () => {
            const { navigation, network } = this.props
            const node = network && network.aps.find(app => app.id === id)
            navigation.navigate('NodeManual', { node, network, newNetwork: true })
          },
        },
        {
          text: 'Remove',
          onPress: () => {
            this.props.editNode(null, { id, networkId, network: this.props.prevNetworkNode[id] || 382 })
          },
        },
      ],
      { cancelable: false },
    )
  }

  toEditNode = id => {
    const { navigation, network } = this.props
    const node = network && network.aps.find(item => item.id === id)
    navigation.navigate('NodeManual', { node, network, newNetwork: true })
  }

  render() {
    const { network, navigation } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Add Node" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View style={styles.flex}>
                <FlatList
                  data={network && network.aps}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.nodesWrap}
                  renderItem={({ item: node }) => (
                    <UniversalItem type="node" key={node.id.toString()} item={node} onPress={this.toEditNode} />
                  )}
                />
              </View>
              <View
                style={{ ...styles.section, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                <NodeCreationMethod isAdoptedNodes navigation={navigation}>
                  <Button active text="Add new node" ref={this._nodeButton} onPress={this.toggleNodeCreation} />
                </NodeCreationMethod>
                <Button text="Back" onPress={this.goBack} />
              </View>
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
  section: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  flex: {
    flex: 1,
  },
  nodesWrap: {
    padding: 8,
    paddingTop: 16,
  },
})

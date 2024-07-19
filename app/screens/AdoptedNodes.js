import React, { Component } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview'
import Modal from 'react-native-modal'
import { UniversalItem, DefaultHeaderHOC, Button } from '../components'
import { Close } from '../components/svg'
import { ManageThemeContext } from '../theme/ThemeManager'

const ItemTypes = {
  NETWORK: 0,
  NODE: 1,
}

const { width } = Dimensions.get('window')

export default class AdoptedNodes extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        const ids = this.state.selectedNetworksWithNodes || {}
        return r1 !== r2 || (typeof r1 !== 'string' && ids[r1.id]) || (typeof r2 !== 'string' && ids[r2.id])
      }).cloneWithRows(this._sortedNetworks()),
      selectedNodesId: [],
      selectedNetworksWithNodes: {},
      showModal: false,
    }

    this._layoutProvider = new LayoutProvider(
      index =>
        typeof this.state.dataProvider.getDataForIndex(index) === 'string' ? ItemTypes.NETWORK : ItemTypes.NODE,
      (type, dim) => {
        switch (type) {
          case ItemTypes.NETWORK:
            dim.width = width - 16
            dim.height = 48
            break
          case ItemTypes.NODE:
            dim.width = width - 16
            dim.height = 76
            break
          default:
            dim.width = 0
            dim.height = 0
        }
      },
    )
  }

  _keyExtractor = (_, index) => String(index)

  sortNetworks = a => (this.props.route.params?.networkId === a.id ? -1 : 1)

  _sortedNetworks = () => {
    const { route, networks } = this.props
    const networkId = route.params?.networkId
    const sorted = networks
      .filter(x => !!x.aps && !!x.aps.length)
      .sort(this.sortNetworks)
      .map(network => [
        network.name,
        ...network.aps.map(node => ({
          ...node,
          networkId: network.id,
          isShowSwitch: networkId !== network.id,
        })),
      ])

    return [].concat(...sorted)
  }

  toggleSelectedNode = (nodeId, networkId) => {
    const { selectedNetworksWithNodes } = this.state
    const currentNetwork = selectedNetworksWithNodes[networkId]

    if (!currentNetwork) {
      this.setState(state => ({
        selectedNetworksWithNodes: {
          ...state.selectedNetworksWithNodes,
          [networkId]: [nodeId],
        },
      }))
    }

    if (currentNetwork && !currentNetwork.includes(nodeId)) {
      this.setState(state => ({
        selectedNetworksWithNodes: {
          ...state.selectedNetworksWithNodes,
          [networkId]: [...currentNetwork, nodeId],
        },
      }))
    }

    if (currentNetwork && currentNetwork.includes(nodeId)) {
      this.setState(state => ({
        selectedNetworksWithNodes: {
          ...state.selectedNetworksWithNodes,
          [networkId]: currentNetwork.filter(id => id !== nodeId),
        },
      }))
    }
  }

  toggleModal = () => {
    this.setState(state => ({ showModal: !state.showModal }))
  }

  onPressAccept = () => {

    const { selectedNetworksWithNodes } = this.state
    const { networkId: targetNetworkId } = this.props.route.params

    const ids = Object.keys(selectedNetworksWithNodes)
      .map(el => selectedNetworksWithNodes[el])
      .flat()

    if (targetNetworkId) {
      if (!ids.length) {
        this.toggleModal()
        return this.onPressCancel()
      }
      console.log('[AdoptedNodes.js] - onPressAccept', targetNetworkId)
      this.props.reassignNodes(null, selectedNetworksWithNodes, targetNetworkId, ids)
      this.toggleModal()
      setTimeout(this.onPressCancel, 200)
    }
  }

  onPressCancel = () => {
    this.props.navigation.goBack(null)
  }

  renderButtons = isModal => (
    <View style={styles.buttonsWrap}>
      <Button isRow text="Cancel" onPress={isModal ? this.toggleModal : this.onPressCancel} />
      <Button
        isRow
        active
        text={isModal ? 'Accept' : 'Save'}
        onPress={isModal ? this.onPressAccept : this.toggleModal}
      />
    </View>
  )

  renderNetworkWillBeChangedModal = () => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <Modal
          useNativeDriver
          hideModalContentWhileAnimating
          style={{ ...styles.bottomModal }}
          onSwipeComplete={() => this.setState({ showModal: false })}
          swipeDirection={['down']}
          isVisible={this.state.showModal}
          onBackdropPress={this.toggleModal}>
          <View style={{ ...styles.bottomModalContainer, backgroundColor: theme.primaryBackground }}>
            <View style={styles.modalTitleWrap}>
              <Text style={{ ...styles.modalTitle, color: theme.primaryText }}>Network will be changed</Text>
              <TouchableOpacity onPress={this.toggleModal}>
                <Close />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              If you want to select Node which is already setup for different network you will need to change associated
              network
            </Text>
            {this.renderButtons(true)}
          </View>
        </Modal>
      )}
    </ManageThemeContext.Consumer>
  )

  _renderItem = (type, item, index, extendedState) => {
    if (type === ItemTypes.NETWORK) {
      return (
        <Text numberOfLines={1} style={styles.networkName}>
          {item}
        </Text>
      )
    }

    const value = !!extendedState[item.networkId] && extendedState[item.networkId].includes(item.id)
    return (
      <UniversalItem
        type="node"
        item={item}
        isShowSwitch={item.isShowSwitch}
        value={value}
        onValueChange={this.toggleSelectedNode}
      />
    )
  }

  render() {
    const { navigation } = this.props
    const { dataProvider, selectedNetworksWithNodes } = this.state

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Adopted Nodes" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              {this.renderNetworkWillBeChangedModal()}
              <RecyclerListView
                layoutProvider={this._layoutProvider}
                dataProvider={dataProvider}
                rowRenderer={this._renderItem}
                style={styles.nodeWrap}
                extendedState={selectedNetworksWithNodes}
              />
              {this.renderButtons()}
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
  nodeWrap: {
    padding: 8,
  },
  networkName: {
    marginTop: 8,
    padding: 8,
    fontSize: 16,
    color: '#666F7A',
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomModalContainer: {
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 32,
  },
  modalText: {
    fontSize: 16,
    color: '#666F7A',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  buttonsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
})

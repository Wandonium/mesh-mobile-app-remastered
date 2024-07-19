import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native'
import { DefaultHeaderHOC, FieldBG, Button } from '../components'
import { markerColor, AlertHelper } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class AssociatedNetwork extends PureComponent {
  state = {
    networks: this.props.networks,
    selectedNetwork: null,
    searchQuery: '',
  }

  _keyExtractor = item => String(item.id)

  selectNetwork = selectedNetwork => {
    this.setState({ selectedNetwork })
  }

  setAssociatedNetwork = () => {
    const { selectedNetwork, networks } = this.state
    if (selectedNetwork !== null) {
      this.props.navigation.goBack()
      this.props.route.params?.setAssociatedNetwork(networks.find(x => x.id === selectedNetwork))
    } else {
      AlertHelper.alert('info', 'Alert', 'You need to choose assotiated network')
    }
  }

  onPressCancel = () => {
    this.props.navigation.goBack(null)
  }

  handleChangeSearchQuery = (text) => {
    console.log('[AssociatedNetwork.js] - handleChangeSearchQuery')
    this.setState({ searchQuery: text })
  }

  _renderItem = ({ item: { id, name, full_address, status } }) => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <TouchableOpacity
          key={id}
          testID={`AssociatedNetwork ${id}`}
          onPress={() => this.selectNetwork(id)}
          style={[
            { ...styles.network, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder },
            this.state.selectedNetwork === id ? { backgroundColor: theme.primarySelected } : {},
          ]}>
          <View style={[styles.networkLine, { backgroundColor: markerColor(status) }]} />
          <Text numberOfLines={1} style={{ ...styles.networkName, color: theme.primaryDarkGray }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.networkAddress}>
            {full_address.trim().length ? full_address : 'Address, City, Index...'}
          </Text>
        </TouchableOpacity>
      )}
    </ManageThemeContext.Consumer>
  )

  render() {
    const { networks, searchQuery } = this.state
    const filteredNetworks = networks.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    console.log('[AssociatedNetwork.js] - networks', filteredNetworks)
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Associated Network" navigation={this.props.navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <FieldBG
                placeholder="Enter network name"
                clearButtonMode="always"
                value={searchQuery}
                onChangeText={this.handleChangeSearchQuery}
              />
              <FlatList
                data={filteredNetworks}
                keyExtractor={this._keyExtractor}
                contentContainerStyle={styles.networkWrap}
                renderItem={this._renderItem}
                extraData={this.state.selectedNetwork}
              />

              <View
                style={{
                  ...styles.buttonsWrap,
                  backgroundColor: theme.primaryBackground,
                  borderColor: theme.primaryBorder,
                }}>
                <Button isRow text="Cancel" onPress={this.onPressCancel} />
                <Button isRow active testID="AssociatedNetworkSave" text="Save" onPress={this.setAssociatedNetwork} />
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
  networkWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  network: {
    height: 68,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6ECF5',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  networkLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  networkName: {
    fontSize: 18,
    color: '#484C52',
    paddingHorizontal: 16,
  },
  networkAddress: {
    fontSize: 14,
    marginTop: 5,
    color: '#8F97A3',
    paddingHorizontal: 16,
  },
  buttonsWrap: {
    paddingTop: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
})

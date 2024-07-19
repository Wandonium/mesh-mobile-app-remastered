import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Alert, Pressable } from 'react-native'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import { Map, HeaderGradient, BottomDrawer, UniversalInfo, UniversalItem } from '../components'
import { Close, RightLongArrow } from '../components/svg'
import { markerColor } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class AllNetworks extends PureComponent {
  _bottomDrawerHeight = Dimensions.get('window').height - 120

  state = {
    selectedNetwork: null,
  }

  static navigationOptions = {
    gestureEnabled: false,
  }

  onDeletePress = (networkId) => {
    Alert.alert(
      'Warning',
      'Are you sure you want to delete this network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            const { deleteNetwork } = this.props
            deleteNetwork(null, networkId)
          },
        },
      ],
      { cancelable: false },
    )
  }

  onUnsubscribe = (networkId) => {
    Alert.alert(
      'Warning',
      'Are you sure you want to unsubscribe from this network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            const { unsubscribeFromNetwork } = this.props
            unsubscribeFromNetwork(null, { id: '', networks: networkId })
          },
        },
      ],
      { cancelable: false },
    )
  }

  longPessActions = (networkId, isShared) => {
    const actions = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Details & Edit',
        onPress: () => {
          this.props.navigation.navigate('Network', { networkId })
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          this.onDeletePress(networkId)
        },
      },
    ]

    if (isShared)
      actions.unshift({
        text: 'Unsubscribe',
        onPress: () => {
          this.onUnsubscribe(networkId)
        },
      })

    Alert.alert('Please select an action', '', actions, { cancelable: true })
  }

  goToNetwork = (networkId) => {
    this.props.navigation.navigate('Network', { networkId })
  }

  goBack = () => {
    this.props.navigation.goBack(null)
  }

  pressOnMarker = (selectedNetworkId) => {
    this.setState({
      selectedNetwork: this.props.networks.find(({ id }) => selectedNetworkId === id),
    })
  }

  clearSelectedNetwork = () => {
    this.setState({ selectedNetwork: null })
  }

  static getDerivedStateFromProps(props, state) {
    if (state.selectedNetwork) {
      const selectedNetwork = props.networks.find((network) => network.id === state.selectedNetwork.id)
      return { selectedNetwork }
    }
    return null
  }

  renderNetworkDetails = ({ id, name, full_address, status, ...networkInfo }) => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <View style={{ ...styles.networkDetails, backgroundColor: theme.primaryCardBgr }}>
          <View style={[styles.networkLine, { backgroundColor: markerColor(status) }]} />

          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.networkDetailsWrap}>
              <Text numberOfLines={1} style={{ ...styles.networkDetailsName, color: theme.primaryText }}>
                {name}
              </Text>
              <TouchableOpacity onPress={this.clearSelectedNetwork}>
                <Close />
              </TouchableOpacity>
            </View>
            <Text numberOfLines={1} style={styles.networkDetailsAddress}>
              {full_address.trim().length ? full_address : 'Street, City, Zip Code...'}
            </Text>

            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <UniversalInfo {...networkInfo} />
          </View>
          <TouchableOpacity style={styles.networkDetailsButton} onPress={() => this.goToNetwork(id)}>
            <Text style={styles.networkDetailsButtonText}>View details</Text>
            <RightLongArrow />
          </TouchableOpacity>
        </View>
      )}
    </ManageThemeContext.Consumer>
  )

  renderBottomDrawer = (networks) => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <BottomDrawer
          offset={30}
          startUp={false}
          containerHeight={this._bottomDrawerHeight}
          downDisplay={this._bottomDrawerHeight - 80}
          backgroundColor={theme.primaryBackground}>

          <View style={styles.line} />
          <View style={{ ...styles.titleWrap, borderColor: theme.primaryBorder }}>
            <Text style={styles.title}>Networks</Text>
          </View>

          <ScrollView contentContainerStyle={{ ...styles.contentContainer, backgroundColor: theme.primaryBackground }}>
            <Pressable>
              {networks.map((network) => (
                <UniversalItem
                  key={network.id.toString()}
                  item={network}
                  onLongPress={this.longPessActions}
                  onPress={this.goToNetwork}
                />
              ))}
            </Pressable>
          </ScrollView>

          {/* <FlatList
            data={networks}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ ...styles.contentContainer, backgroundColor: theme.primaryBackground }}
            renderItem={({ item: network }) => (
              <UniversalItem
                key={network.id.toString()}
                item={network}
                onLongPress={this.longPessActions}
                onPress={this.goToNetwork}
              />
            )}
          /> */}
        </BottomDrawer>
      )}
    </ManageThemeContext.Consumer>
  )

  render() {
    const { selectedNetwork } = this.state
    const { networks } = this.props

    return (
      <View style={styles.container}>
        <Map
          selectedMarkerId={selectedNetwork && selectedNetwork.id}
          pressOnMarker={this.pressOnMarker}
          offset={selectedNetwork ? 160 : 110}
          markers={networks}
        />

        <HeaderGradient onPress={this.goBack} />

        {selectedNetwork ? this.renderNetworkDetails(selectedNetwork) : this.renderBottomDrawer(networks)}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    alignSelf: 'center',
    backgroundColor: 'rgba(203,205,204,0.5)',
  },
  titleWrap: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    color: '#484C52',
    fontSize: 24,
  },
  contentContainer: {
    padding: 8,
    paddingTop: 16,
  },
  networkLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  networkDetails: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 160,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  networkDetailsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkDetailsName: {
    flex: 1,
    fontSize: 24,
  },
  networkDetailsAddress: {
    marginVertical: 6,
    color: '#8F97A3',
    fontSize: 14,
  },
  networkDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 10,
  },
  networkDetailsButtonText: {
    fontSize: 16,
    color: '#1F6BFF',
    marginRight: 8,
  },
})

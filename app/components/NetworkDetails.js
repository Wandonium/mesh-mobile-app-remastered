import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, Alert, Dimensions, BackHandler } from 'react-native'
import { DataProvider, LayoutProvider } from 'recyclerlistview'
import { TouchableOpacity, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { ScrollView } from 'react-native-gesture-handler'

import Button from './Button'
import Field from './Field'
import SelectBox from './SelectBox'
import NodeCreationMethod from './NodeCreationMethod'
import EditNetworkChannels from './EditNetworkChannels'
import UniversalItem from './UniversalItem'
import ModalComponent from './Modal'
import { SSIDList, Chart } from '../containers'
import { markerColor, AlertHelper, getUpDownData, sortBy, getStatusBarHeight } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

const { width, height } = Dimensions.get('window')

const networkViewHeight = height - 250

const nodesDataProvider = new DataProvider((r1, r2) => r1 !== r2)

const layoutProvider = new LayoutProvider(
  () => 0,
  (type, dim) => {
    // eslint-disable-next-line no-param-reassign
    dim.width = width - 16
    // eslint-disable-next-line no-param-reassign
    dim.height = 76
  },
)

const filters = [
  { title: 'Name', field: 'name', order: 'asc' },
  { title: 'Status', field: 'status', order: 'asc' },
  { title: 'Clients', field: 'clients', order: 'desc' },
]

export default class NetworkDetails extends PureComponent {
  state = {
    filter: null,
    isChannelsEdit: false,
    isSSIDList: false,
    activeTabIndex: this.props.activeTabIndex,
    tabItems:
      this.props.isAdmin && !this.props.network.is_default ? ['Overview', 'Nodes', 'Settings'] : ['Overview', 'Nodes'],
    full_address: this.props.network.full_address,
    networkName: this.props.network.name,
    country_short_name: '',
    latitude: this.props.network.lat || 0,
    longitude: this.props.network.lng || 0,
    // nodesDataProvider: nodesDataProvider.cloneWithRows(this.props.network.aps),
  }

  componentDidMount() {
    console.log('[NetworkDetails.js] - componentDidMount', this.props.route.params?.fromCreateNetworkDone)
    if(this.props.route.params?.fromCreateNetworkDone === true) {
      this.changeActiveTab(1)
    }
  }

  _nodeButton = React.createRef()

  selectSort = (newFilter) => {
    this.setState((filter) => ({ filter: filter === newFilter ? null : newFilter }))
  }

  changeActiveTab = (activeTabIndex) => {
    this.setState({ activeTabIndex })
  }

  toggleChannelsEdit = () => {
    this.setState((state) => ({ isChannelsEdit: !state.isChannelsEdit }))
  }

  toggleSSIDList = () => {
    this.setState((state) => ({ isSSIDList: !state.isSSIDList }))
  }

  onSetNetworkCoords = (full_address, country_short_name, latitude, longitude) => {
    this.setState({ full_address, country_short_name, latitude, longitude }, this.updateNetworkLocation)
  }

  onSelectLocationPress = () => {
    const { full_address, lat, lng } = this.props.network
    this.props.navigation.navigate('Location', {
      currentRegion: { full_address, latitude: lat, longitude: lng },
      onSetNetworkCoords: this.onSetNetworkCoords,
    })
  }

  updateNetworkLocation = () => {
    const { country_short_name, full_address, latitude: lat, longitude: lng } = this.state
    const { id } = this.props.network
    this.props.editNetwork({ id, country_short_name, full_address, lat, lng })
  }

  updateNetworkName = () => {
    const { network, editNetwork } = this.props
    const name = this.state.networkName

    if (network.name !== name) {
      if (!name.trim()) {
        AlertHelper.alert('error', 'Error', 'Network Name can not be empty')
      } else {
        editNetwork({ id: network?.id, name })
      }
    }
  }

  onDeletePress = () => {
    Alert.alert(
      'Warning',
      'Are you sure you want to delete this network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            const { deleteNetwork, network, navigation } = this.props
            deleteNetwork(navigation, network?.id)
          },
        },
      ],
      { cancelable: false },
    )
  }

  onUnsubscribe = () => {
    Alert.alert(
      'Warning',
      'Are you sure you want to unsubscribe this network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            const { unsubscribeFromNetwork, network, navigation } = this.props
            unsubscribeFromNetwork(navigation, { id: '', networks: network?.id })
          },
        },
      ],
      { cancelable: false },
    )
  }

  toSSIDList = () => {
    this.open('SSIDList')
  }

  toChannelsEdit = () => {
    this.open('EditNetworkChannels')
  }

  toChannelScan = () => {
    this.open('ChannelScan')
  }

  toSharingSettings = () => {
    this.open('SharingSettings')
  }

  open = (screen) => {
    const { network, navigation } = this.props
    navigation.navigate(screen, { networkId: network?.id })
  }

  toggleNodeCreation = () => {
    this._nodeButton.current.showModal(this.props.network)
  }

  renderButton = () => {
    const { isAdmin, navigation } = this.props

    return (
      isAdmin && (
        <NodeCreationMethod isAdoptedNodes navigation={navigation}>
          <Button active text="Add new node" ref={this._nodeButton} onPress={this.toggleNodeCreation} />
        </NodeCreationMethod>
      )
    )
  }

  renderOverview = ({ active_ap, aps, clients, gateways_upload_rate, gateways_download_rate, status }) => {
    const { upload, download, points } = getUpDownData(gateways_upload_rate, gateways_download_rate)
    const {
      network,
      networkStatistic,
      getNetworkHistory,
      getNetworkStatistic,
      selectedPeriod,
      interval,
      setRequestTimeRangeInterval,
      navigation,
    } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <ScrollView style={styles.negativeMargin}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.overviewWrap}>
                <View
                  style={{
                    ...styles.overviewBlock,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <Text style={[styles.overviewText, { color: markerColor(status) }]}>
                    {active_ap}/{aps?.length}
                  </Text>
                  <Text style={[styles.overviewSubText, styles.uppercase]}>Active nodes</Text>
                </View>
                <View
                  style={{
                    ...styles.overviewBlock,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <Text style={{ ...styles.overviewText, color: theme.primaryText }}>{clients}</Text>
                  <Text style={[styles.overviewSubText, styles.uppercase]}>Users</Text>
                </View>
              </View>
              <View style={{ ...styles.overviewWrap }}>
                <View
                  style={{
                    ...styles.overviewBlock,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <Text style={{ ...styles.overviewText, color: theme.primaryText }}>
                    <Text style={styles.download}>{download}↓ </Text>
                    <Text>/</Text>
                    <Text style={styles.upload}> {upload}↑</Text>
                  </Text>
                  <Text style={styles.overviewSubText}>Capacity ({points})</Text>
                </View>
              </View>
              <Chart
                selectedPeriod={selectedPeriod}
                interval={interval}
                network={network}
                getNetworkHistory={getNetworkHistory}
                networkStatistic={networkStatistic}
                getNetworkStatistic={getNetworkStatistic}
                setRequestTimeRangeInterval={setRequestTimeRangeInterval}
                navigate={navigation.navigate}
              />
              {network.is_shared && (
                <TouchableOpacity style={styles.deleteButton} onPress={this.onUnsubscribe}>
                  <Text style={styles.deleteButtonText}>Unsubscribe from network</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  _renderNodeItem = ({ item }) => {
    return <UniversalItem type="node" item={item} onPress={this.props.pressOnNode} />
  }

  renderNodeList = () => {
    const { filter } = this.state
    const { aps: nodes = [] } = this.props.network
    const sortedNodes = filter !== null ? [...nodes].sort(sortBy(filters[filter].field, filters[filter].order)) : nodes
    //console.log('[NetworkDetails.js] - renderNodeList sortedNodes', this.props.network)
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={styles.flex}>
            {sortedNodes && sortedNodes.length ? (
              <>
                <View style={styles.tags}>
                  <Text style={{ ...styles.sortText, color: theme.primaryText }}>Sort by</Text>
                  {filters.map((item, index) => {
                    const isActive = this.state.filter === index
                    return (
                      <TouchableOpacity
                        key={item.field}
                        style={[
                          { ...styles.sortTag, backgroundColor: theme.primaryCardBgr },
                          isActive ? styles.sortTagActive : {},
                        ]}
                        onPress={() => this.selectSort(index)}>
                        <Text style={[styles.tagText, isActive ? styles.tagTextActive : {}]}>{item.title}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <View style={styles.nodeListWrap}>
                  {/* <RecyclerListView
                    layoutProvider={layoutProvider}
                    dataProvider={nodesDataProvider.cloneWithRows(sortedNodes)}
                    rowRenderer={this._renderNodeItem}
                  /> */}
                  <BottomSheetFlatList
                    data={sortedNodes}
                    keyExtractor={(i) => i.id}
                    renderItem={this._renderNodeItem}
                    contentContainerStyle={styles.contentContainer}
                  />
                </View>
              </>
            ) : (
              <View style={[styles.nodeList, { alignSelf: 'center' }]}>
                <Text style={{ ...styles.sortText, color: theme.primaryText }}>This network has no Nodes yet</Text>
              </View>
            )}

            <View style={[styles.buttonWrap, styles.negativeMargin]}>{this.renderButton()}</View>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderSettings = (network) => {
    const { canShare } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <ScrollView style={styles.negativeMargin}>
            {/* <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 180} behavior="position"> */}
            <TouchableOpacity activeOpacity={1}>
              <View
                style={{
                  ...styles.section,
                  color: theme.primaryText,
                  borderColor: theme.primaryBorder,
                  backgroundColor: theme.primaryCardBgr,
                }}>
                <SelectBox title="SSIDs" onPress={this.toSSIDList} />
                <SelectBox disableBorderBottom title="Bandwidth & Channels" onPress={this.toChannelsEdit} />
                <SelectBox disableBorderBottom title="Channel Scan" onPress={this.toChannelScan} />
              </View>
              <Text style={styles.sectionTitle}>NETWORK PREFERENCES</Text>
              <View
                style={{
                  ...styles.section,
                  color: theme.primaryText,
                  borderColor: theme.primaryBorder,
                  backgroundColor: theme.primaryCardBgr,
                }}>
                <View style={styles.fieldWrap}>
                  <Field
                    testID="NetworkDetailsName"
                    label="Name"
                    placeholder={network.name}
                    value={this.state.networkName}
                    onChangeText={(text) => this.setState({ networkName: text })}
                    onEndEditing={this.updateNetworkName}
                  />
                </View>
                <SelectBox disableBorderBottom title="Location" onPress={this.onSelectLocationPress} rightText="Edit" />
                {canShare && (
                  <SelectBox disableBorderBottom title="Sharing Settings" onPress={this.toSharingSettings} />
                )}
              </View>
              {!network.is_default && (
                <TouchableOpacity
                  style={{
                    ...styles.deleteButton,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}
                  onPress={this.onDeletePress}>
                  <Text style={styles.deleteButtonText}>Delete this network</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {/* </KeyboardAvoidingView> */}
          </ScrollView>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderContent = (network) => {
    switch (this.state.activeTabIndex) {
      case 0:
        return this.renderOverview(network)
      case 1:
        return this.renderNodeList()
      case 2:
        return this.renderSettings(network)
      default:
        return this.renderOverview(network)
    }
  }

  render() {
    const { tabItems, activeTabIndex, isChannelsEdit, isSSIDList } = this.state
    const { network } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <>
            <View
              style={[
                styles.tabsWrap,
                {
                  backgroundColor: theme.primaryBackground,
                  borderColor: theme.primaryBorder,
                },
              ]}>
              {tabItems.map((name, index) => (
                <TouchableOpacity
                  testID={`NetworkDetails${name}`}
                  key={index}
                  onPress={() => this.changeActiveTab(index)}
                  style={[styles.tab, activeTabIndex === index && styles.activeTab]}>
                  <Text style={[styles.tabText, activeTabIndex === index && styles.activeTabText]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.contentView, { backgroundColor: theme.primaryBackground }]}>
              {this.renderContent(network)}
            </View>
            <ModalComponent title="Channels" isModalVisible={isChannelsEdit} toggleModal={this.toggleChannelsEdit}>
              <EditNetworkChannels network={network} saveChanges={this.saveChannelsChanges} />
            </ModalComponent>
            <ModalComponent title="SSIDs" isModalVisible={isSSIDList} toggleModal={this.toggleSSIDList}>
              <SSIDList networkId={network?.id} toggleModal={this.toggleSSIDList} />
            </ModalComponent>
          </>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  fieldWrap: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  deleteButton: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  deleteButtonText: {
    fontSize: 16,
    color: 'red',
  },
  tabsWrap: {
    paddingTop: 25,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    // borderColor: '#DEE5EF',
    backgroundColor: 'white',
    height: 60,
  },
  tab: {
    flex: 1,
    height: 34,
    paddingBottom: 12,
    marginBottom: -1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2550D9',
  },
  tabText: {
    fontSize: 17,
    lineHeight: 20,
    color: '#8F97A3',
  },
  activeTabText: {
    color: '#2550D9',
  },
  overviewWrap: {
    marginTop: 16,
    //marginHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nodeListWrap: {
    flex: 1,
    marginTop: 16,
  },
  nodeList: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  overviewBlock: {
    flex: 1,
    // backgroundColor: '#FFF',
    borderRadius: 5,
    marginHorizontal: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    // borderColor: '#E6ECF5',
  },
  flex: {
    flex: 1,
    paddingBottom: 20
  },
  overviewText: {
    fontSize: 38,
    fontWeight: '300',
    color: '#101114',
  },
  download: {
    color: '#00B860',
  },
  upload: {
    color: '#1F6BFF',
  },
  overviewSubText: {
    fontSize: 12,
    color: '#6D727A',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  negativeMargin: {
    //marginHorizontal: -8,
  },
  buttonWrap: {
    marginTop: 16,
    paddingHorizontal: -8,
  },
  sortText: {
    fontSize: 16,
    // color: '#101114',
    lineHeight: 20,
    paddingLeft: 8,
  },
  tags: {
    paddingTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sortTag: {
    paddingHorizontal: 16,
    marginHorizontal: 6,
    marginVertical: 5,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },
  sortTagActive: {
    backgroundColor: '#1F6BFF',
  },
  tagText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1F6BFF',
  },
  tagTextActive: {
    fontSize: 16,
    lineHeight: 22,
    color: '#FFF',
  },
  contentView: {
    height: networkViewHeight,
  },
})

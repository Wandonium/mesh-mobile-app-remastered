import React, { PureComponent } from 'react'
import {
  AppState,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  Alert,
  StatusBar,
  PermissionsAndroid,
} from 'react-native'
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview'
import Modal from 'react-native-modal'
import NetInfo from '@react-native-community/netinfo'
import {request, requestMultiple, PERMISSIONS} from 'react-native-permissions';
import { Modal as ModalScreen, FieldBG, Button } from '../components'
import {
  Map,
  WiFi,
  User,
  Throughput,
  Filter,
  Search,
  Reboot,
  Close,
  Logo,
  Alerts,
  NoSearchResults,
  NoNetworksYet,
  Share,
} from '../components/svg'
import { markerColor, getStatusBarHeight, AlertHelper } from '../services'
import { NetworkContext } from '../components/NetworkProvider'
import { ManageThemeContext } from '../theme/ThemeManager'
import cachingService from '../services/CachingService'
import * as Progress from 'react-native-progress'
const { width } = Dimensions.get('window')

const TEXTS = [
  "Loading Network.",
  "Loading Network..",
  "Loading Network..."
]

const filters = [
  { title: 'Name', field: 'name', order: 'asc' },
  { title: 'Download', field: 'gateways_download_rate', order: 'desc' },
  { title: 'Upload', field: 'gateways_upload_rate', order: 'desc' },
  { title: 'Active users', field: 'clients', order: 'desc' },
  { title: 'Active nodes', field: 'active_ap', order: 'desc' },
]

const sortBy = (key, order = 'asc') => (a, b) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
    return 0
  }

  const varA = a[key] === 'name' ? a[key].toUpperCase() : a[key]
  const varB = b[key] === 'name' ? b[key].toUpperCase() : b[key]

  // const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
  // const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

  let comparison = 0
  if (varA > varB) comparison = 1
  else if (varA < varB) comparison = -1

  return order === 'desc' ? comparison * -1 : comparison
}

const ViewTypes = {
  HALF_LEFT: 1,
  HALF_RIGHT: 2,
}

const networksDataProvider = new DataProvider((r1, r2) => r1 !== r2)

const layoutProvider = new LayoutProvider(
  (index) => {
    if (index % 2 === 1) {
      return ViewTypes.HALF_LEFT
    }
    return ViewTypes.HALF_RIGHT
  },
  (type, dim) => {
    switch (type) {
      case ViewTypes.HALF_LEFT:
        dim.width = (width - 20) / 2 - 0.0001
        dim.height = 104
        break
      case ViewTypes.HALF_RIGHT:
        dim.width = (width - 20) / 2
        dim.height = 104
        break
      default:
        dim.width = 0
        dim.height = 0
    }
  },
)

export default class Dashboard extends PureComponent {
  static contextType = NetworkContext

  reconnectTimeout = null
  state = {
    searchQuery: '',
    filter: null,
    isSortModalVisible: false,
    isSearchModalVisible: false,
    progressIndex: 0,
    progressPer: 0
  }

  componentDidMount() {
    console.log('[Dashboard.js] - componentDidMount')
    const { navigation } = this.props
    if (Platform.OS === 'android') {
      // Required for the bluetooth search
      // Should be called before the navigation to search tab
        requestMultiple([PERMISSIONS.ANDROID.BLUETOOTH_CONNECT, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.BLUETOOTH_SCAN])
     }
    let progressCal = 0
    this.focusListener = navigation.addListener('focus', async () => {
      //console.log('[Dashboard.js] - didFocus', this.state.progressPer, this.props.loadingProgress)
      console.log('[Dashboard.js] - didFocus')
      if(this.props.loadingProgress >= 0 && this.props.loadingProgress <= 100) {
        this.setState({ progressPer: this.props.loadingProgress })
      } else {
        this.setState({ progressPer: 0 })
      }
      this.intervalId = setInterval(() => {
        this.setState({ progressIndex: this.state.progressIndex + 1})
      }, 700)
      this.intervalId2 = setInterval(() => {
        // console.log('[Dashboard.js] - this.state.progressPer', this.state.progressPer)
        if(this.state.progressPer === 100) {
          this.setState({ progressPer: 100 })
        } else {
          this.setState({ progressPer: Number(this.state.progressPer)+1 })
        }
        if(this.state.progressPer >= 0 && this.state.progressPer < 100 && this.props.maxNum > 0 && this.props.loadingCounter > 0) {
          this.props.setLoadingProgress(this.state.progressPer)
        }
      }, 2000)
    })
    this.blurListener = navigation.addListener('blur', async () => {
      console.log('[Dashboard.js] - willBlur')
      clearTimeout(this.intervalId)
      clearTimeout(this.intervalId2)
    })
    this.appStateListener = AppState.addEventListener('change', nextAppState => {
      if(nextAppState === 'active' && this.props.maxNum > 0 && this.props.loadingCounter > 0) {
        console.log('[Dashboard.js] - App is in Active state')
        this.refreshNetwork()
      }
    })
    navigation.addListener('beforeRemove', (e) => {
      console.log('[Dashboard.js] - beforeRemove')
      e.preventDefault()
    })
  }

  componentWillUnmount() {
    console.log('[Dashboard.js] - componentWillUnmount')
    
    this.appStateListener.remove()
  }

  componentDidUpdate() {
    const { loadingCounter, maxNum } = this.props
    if(maxNum > 0 && loadingCounter > 0 ) {
      progressCal = (maxNum-loadingCounter)*100/maxNum
      if(progressCal > this.state.progressPer) {
        this.setState({ progressPer: progressCal.toFixed(0) })
      }
    }

    this.checkForCachedNodes()
    if (!this.context.isInternetReachable) {
      this.reconnectTimeout = setTimeout(() => {
        this.props.navigation.navigate('bleSearchStackOffline')
      }, 5000)
    } else {
      clearTimeout(this.reconnectTimeout)
    }
  }

  checkForCachedNodes = async () => {
    // console.log('[Dashboard.js] - checkForCachedNodes')
    const { createNode } = this.props

    const { isConnected } = await NetInfo.fetch()
    if (isConnected) {
      const node = await cachingService.getNodeData()
      if (typeof node === 'boolean') {
        return
      }
      const [navigation, associatedNetwork, data, navParam] = node
      createNode(navigation, associatedNetwork, data, navParam)
      AlertHelper.alert('info', 'The node you saved was connected')
      cachingService.clearNodeData()
    }
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
        // style: 'destructive',
        onPress: () => {
          this.onUnsubscribe(networkId)
        },
      })

    Alert.alert('Please select an action', '', actions, { cancelable: true })
  }

  goToNetwork = (networkId) => {
    this.props.navigation.navigate('Network', { networkId })
  }

  goToNode = (network, node) => {
    this.props.navigation.navigate('Network', { networkId: network, selectedNode: node })
  }

  goToAllNetworks = () => {
    this.props.navigation.navigate('AllNetworks')
  }

  goToAlerts = () => {
    this.props.navigation.navigate('Alerts')
  }

  openSearch = () => {
    this.toggleSearchModal()
  }

  refreshNetwork = () => {
    this.setState({ progressPer: 0 })
    this.props.setLoadingProgress(this.state.progressPer)
    this.props.refreshNetwork()
  }

  openSort = () => {
    this.toggleSortModal()
  }

  toggleSortModal = () => {
    this.setState((state) => ({ isSortModalVisible: !state.isSortModalVisible }))
  }

  toggleSearchModal = () => {
    this.setState((state) => ({ isSearchModalVisible: !state.isSearchModalVisible }))
  }

  selectSort = (filter) => {
    this.setState((state) => ({ filter: state.filter === filter ? null : filter }))
  }

  _keyExtractor = (item) => String(item.id)

  _searchResultItem = ({ item: { id, status, name, full_address } }) => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <TouchableOpacity
          key={id}
          onPress={() => {
            this.toggleSearchModal()
            setTimeout(() => {
              this.goToNetwork(id)
              this.setState({ searchQuery: '' })
            }, 250)
          }}
          style={[
            { ...styles.network, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder },
            this.state.selectedNetwork === id ? { backgroundColor: '#c0cfed' } : {},
          ]}>
          <View style={[styles.networkLine, { backgroundColor: markerColor(status) }]} />
          <Text numberOfLines={1} style={{ ...styles.networkListName, color: theme.primaryDarkGray }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={[styles.networkAddress]}>
            {full_address.trim().length ? full_address : 'Street, City, Zip Code...'}
          </Text>
        </TouchableOpacity>
      )}
    </ManageThemeContext.Consumer>
  )

  searchModal = (networks) => {
    const filteredNetworks = networks.filter((n) => n.name.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <ModalScreen
            title="Search"
            isModalVisible={this.state.isSearchModalVisible}
            toggleModal={this.toggleSearchModal}>
            <View
              style={{
                ...styles.modalContainer,
                backgroundColor: theme.primaryBackground,
                borderColor: theme.primaryBorder,
              }}>
              <View
                style={{
                  ...styles.searchContainer,
                  backgroundColor: theme.primaryBackground,
                  borderColor: theme.primaryBorder,
                }}>
                <View style={styles.flex}>
                  <FieldBG
                    placeholder="Enter network name"
                    clearButtonMode="always"
                    value={this.state.searchQuery}
                    onChangeText={(searchQuery) => this.setState({ searchQuery })}
                  />
                </View>
              </View>

              {filteredNetworks.length ? (
                <FlatList
                  data={filteredNetworks}
                  keyExtractor={this._keyExtractor}
                  contentContainerStyle={styles.contentContainer}
                  renderItem={this._searchResultItem}
                  extraData={this.state.selectedNetwork}
                />
              ) : this.state.searchQuery ? (
                <View style={styles.noResults}>
                  <NoSearchResults />
                  <Text style={styles.noResultsText}>No networks found with given name</Text>
                </View>
              ) : (
                <View style={styles.noResults}>
                  <NoSearchResults />
                  <Text style={styles.noResultsText}>Enter name of network and explore results</Text>
                </View>
              )}
            </View>
          </ModalScreen>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  sortModal = () => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <Modal
          useNativeDriver
          hideModalContentWhileAnimating
          style={styles.bottomModal}
          onSwipeComplete={() => this.setState({ isSortModalVisible: false })}
          swipeDirection={['down']}
          isVisible={this.state.isSortModalVisible}
          onBackdropPress={this.toggleSortModal}>
          <View style={{ ...styles.bottomModalContainer, backgroundColor: theme.primaryBackground }}>
            <View style={styles.modalTitleWrap}>
              <Text style={{ ...styles.modalTitle, color: theme.primaryText }}>Sort by</Text>
              <TouchableOpacity onPress={this.toggleSortModal}>
                <Close fill="#A3ACBA" />
              </TouchableOpacity>
            </View>
            <View style={styles.tags}>
              {filters.map((item, index) => {
                const isActive = this.state.filter === index
                return (
                  <TouchableOpacity
                    key={item.field}
                    style={[styles.sortTag, isActive ? styles.sortTagActive : {}]}
                    onPress={() => this.selectSort(index)}>
                    <Text style={[styles.tagText, isActive ? styles.tagTextActive : {}]}>{item.title}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={{ ...styles.buttonWrap }}>
              <Button active text="Apply" onPress={this.toggleSortModal} />
            </View>
          </View>
        </Modal>
      )}
    </ManageThemeContext.Consumer>
  )

  renderNetworkItem = (
    type,
    { id, name, gateways_download_rate, gateways_upload_rate, is_shared, active_ap, total_ap, clients, status },
  ) => (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <View style={styles.networkItemWraper}>
          <TouchableOpacity
            testID={`Dashboard${id}`}
            onLongPress={() => this.longPessActions(id, is_shared)}
            onPress={() => this.goToNetwork(id)}
            style={{
              ...styles.networkItem,
              backgroundColor: theme.primaryCardBgr,
              borderColor: theme.primaryBorder,
            }}>
            <View style={[styles.networkLine, { backgroundColor: markerColor(status) }]} />
            {is_shared && (
              <View style={styles.sharedIcon}>
                <Share size={16} fill="red" />
              </View>
            )}
            <Text numberOfLines={1} style={{ ...styles.networkNameText, color: theme.primaryText }}>
              {name}
            </Text>
            <View style={styles.networkInfo}>
              <View style={styles.networkInfoSection}>
                <WiFi />
                <Text style={styles.networkInfoText}>
                  {active_ap}/{total_ap}
                </Text>
              </View>
              <View style={styles.networkInfoSection}>
                <User />
                <Text style={styles.networkInfoText}>{clients}</Text>
              </View>
              <View style={[styles.networkInfoSection, { flex: 1.2 }]}>
                <Throughput fill="#a8b1bf" size="16" />
                <Text numberOfLines={1} style={styles.networkInfoText}>
                  {Math.round(gateways_download_rate)}↓/{Math.round(gateways_upload_rate)}↑
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ManageThemeContext.Consumer>
  )

  networkList = ({
    item: { id, name, gateways_download_rate, gateways_upload_rate, active_ap, total_ap, clients, status },
  }) => (
    <View key={id} style={styles.networkItemWrap}>
      <TouchableOpacity testID={`Dashboard${id}`} onPress={() => this.goToNetwork(id)} style={styles.networkItem}>
        <View style={[styles.networkLine, { backgroundColor: markerColor(status) }]} />

        <Text numberOfLines={1} style={styles.networkNameText}>
          {name}
        </Text>
        <View style={styles.networkInfo}>
          <View style={styles.networkInfoSection}>
            <WiFi />
            <Text style={styles.networkInfoText}>
              {active_ap}/{total_ap}
            </Text>
          </View>
          <View style={styles.networkInfoSection}>
            <User />
            <Text style={styles.networkInfoText}>{clients}</Text>
          </View>
          <View style={[styles.networkInfoSection, { flex: 1.2 }]}>
            <Throughput fill="#a8b1bf" size="16" />
            <Text numberOfLines={1} style={styles.networkInfoText}>
              {Math.round(gateways_download_rate)}↓/{Math.round(gateways_upload_rate)}↑
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )

  render() {
    const { filter } = this.state
    const { networks = [], loadingCounter, maxNum } = this.props

    const sortedItems =
      filter !== null ? [...networks].sort(sortBy(filters[filter].field, filters[filter].order)) : networks
    const total_count = networks.length || 0
    const total_count_ap = total_count ? networks.map((net) => net.total_ap).reduce((prev, next) => prev + next) : 0
    const total_count_client = total_count ? networks.map((net) => net.clients).reduce((prev, next) => prev + next) : 0
    
    const progressBar = Number((this.state.progressPer/100).toFixed(2))

    //console.log('[Dashboard.js] - loadingCounter maxNum', loadingCounter, maxNum)
    return (
      <ManageThemeContext.Consumer>
        {({ mode, theme }) => (
          <View testID="Dashboard" style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
            <View style={styles.section}>
              <View style={styles.header}>
                <Logo height={36} />
              </View>
            </View>
            {networks.length || !this.context.isConnected || !this.context.isInternetReachable ? (
              <>
                <View style={[styles.section, { marginTop: 0 }]}>
                  <View style={styles.overviewWrap}>
                    <View
                      style={{
                        ...styles.overviewItem,
                        backgroundColor: theme.primaryCardBgr,
                        borderColor: theme.primaryBorder,
                      }}>
                      <Text style={{ ...styles.overviewItemNumber, color: theme.primaryText }}>{total_count}</Text>
                      <Text style={styles.overviewItemName}>Networks</Text>
                    </View>
                    <View
                      style={{
                        ...styles.overviewItem,
                        backgroundColor: theme.primaryCardBgr,
                        borderColor: theme.primaryBorder,
                      }}>
                      <Text style={{ ...styles.overviewItemNumber, color: theme.primaryText }}>{total_count_ap}</Text>
                      <Text style={styles.overviewItemName}>Nodes</Text>
                    </View>
                    <View
                      style={{
                        ...styles.overviewItem,
                        backgroundColor: theme.primaryCardBgr,
                        borderColor: theme.primaryBorder,
                      }}>
                      <Text style={{ ...styles.overviewItemNumber, color: theme.primaryText }}>
                        {total_count_client}
                      </Text>
                      <Text style={styles.overviewItemName}>Users</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.sectionScroll}>
                  <View style={styles.titleWrapper}>
                    <Text style={{ ...styles.title, color: theme.primaryText }}>Networks</Text>
                    <View style={styles.filterWrapper}>
                      <TouchableOpacity style={styles.icon} onPress={this.openSearch}>
                        <Search size={20} fill="#1F6BFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.icon} onPress={this.openSort}>
                        <Filter size={20} fill="#1F6BFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.icon} onPress={this.goToAlerts}>
                        <Alerts size={20} fill="#1F6BFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.icon} onPress={this.refreshNetwork}>
                        <Reboot size={20} fill="#1F6BFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {maxNum > 0 && loadingCounter > 0 ? (
                    <View style={styles.progressWrap}>
                      <Text style={{ ...styles.progressTextStyle, color: theme.primaryText }}>
                        {TEXTS[this.state.progressIndex % 3]}
                      </Text>
                      <View style={{alignItems: 'center',flexDirection: 'row'}}>
                        <Progress.Bar progress={progressBar} width={150} />  
                        <Text style={{ ...styles.progressTextStyle, color: theme.primaryText }}>
                          {"  "}{this.state.progressPer}%
                        </Text>
                      </View>
                      
                    </View>
                  ) : null}
                  <RecyclerListView
                    style={styles.networkWrap}
                    layoutProvider={layoutProvider}
                    dataProvider={networksDataProvider.cloneWithRows(sortedItems)}
                    rowRenderer={this.renderNetworkItem}
                    // renderFooter={this.renderFooterWrap}
                  />
                </View>
              </>
            ) : (
              <View style={styles.noResults}>
                <NoNetworksYet />
                <Text style={styles.noResultsText}>No networks yet</Text>
              </View>
            )}

            <TouchableOpacity onPress={this.goToAllNetworks} style={styles.showNetworks}>
              <Map />
            </TouchableOpacity>
            {this.sortModal()}
            {this.searchModal(networks)}
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#000',
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignContent: 'stretch',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  flex: {
    flex: 1,
  },
  section: {
    marginTop: 30,
  },
  header: {
    marginTop: getStatusBarHeight() - 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionScroll: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: -6,
  },
  titleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    // color: '#FFF',
    // opacity: 0.87,
    color: '#101114',
    fontWeight: '500',
    fontSize: 26,
    paddingHorizontal: 6,
  },
  filterWrapper: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
  },
  icon: {
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderRadius: 18,
    aspectRatio: 1,
    height: 36,
    width: 36,
  },
  sharedIcon: {
    position: 'absolute',
    left: 4,
    top: 6,
  },
  overviewWrap: {
    marginTop: 20,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  overviewItem: {
    width: '31%',
    // backgroundColor: '#121212',
    backgroundColor: '#fff',
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    // borderColor: '#343434',
    borderColor: '#E6ECF5',
  },
  overviewItemNumber: {
    color: '#292D33',
    // color: '#FFF',
    // opacity: 0.87,
    fontWeight: '300',
    fontSize: 34,
  },
  overviewItemName: {
    color: '#8F97A3',
    fontWeight: '500',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  networkWrap: {
    marginTop: 8,
    // justifyContent: 'space-between',
    flexWrap: 'wrap',
    flexDirection: 'row',
    paddingBottom: 16,
  },
  networkItemWrap: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  networkItemWraper: {
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  networkItem: {
    // backgroundColor: '#121212',
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopWidth: 0,
    // borderColor: '#242424',
    borderColor: '#E6ECF5',
    alignItems: 'center',
    paddingVertical: 12,
  },
  networkLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  networkNameText: {
    // flex: 1,
    color: '#101114',
    // color: '#FFF',
    // opacity: 0.6,
    fontWeight: '500',
    fontSize: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  networkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  networkInfoSection: {
    flex: 1,
    alignItems: 'center',
  },
  networkInfoText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8F97A3',
    marginTop: 3,
  },
  showNetworks: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: '#1F6BFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 7 },
        shadowColor: '#101114',
        shadowOpacity: 0.24,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomModalContainer: {
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingTop: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 24,
    color: '#101114',
    lineHeight: 32,
  },
  network: {
    height: 68,
    marginBottom: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  networkAddress: {
    fontSize: 14,
    marginTop: 5,
    color: '#8F97A3',
    paddingHorizontal: 16,
  },
  networkListName: {
    fontSize: 18,
    color: '#484C52',
    paddingHorizontal: 16,
  },

  tags: {
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortTag: {
    paddingHorizontal: 16,
    marginHorizontal: 6,
    marginVertical: 5,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#E6EEFF',
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
  noResults: {
    flex: 1,
    marginHorizontal: 36,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  noResultsText: {
    justifyContent: 'center',
    // alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 30,
    color: '#B0B7C2',
    textAlign: 'center',
    marginTop: 24,
  },
  buttonWrap: {
    marginTop: 10,
  },
  progressWrap: {
    height: '4%',
    width: '100%',
    margin: 7,
    paddingRight: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressTextStyle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
})

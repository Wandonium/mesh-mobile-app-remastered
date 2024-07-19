import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import Modal from 'react-native-modal'
import moment from 'moment'
import { Button, FieldBG, DefaultHeaderHOC } from '../components'
import { Check, Filter, Archive, NoNewAlerts } from '../components/svg'
import { ManageThemeContext } from '../theme/ThemeManager'

const getUserMessage = (alert, message = 'is registered by invite') => (
  <Text>{`User "${alert.user_name}" ${message}`}</Text>
)

const getApMessage = (alert, message = '') => (
  <Text>{`Network "${alert.network_name.trim()}": ${alert.access_point_name} ${message}`}</Text>
)

const getApMessageReboot = alert => (
  <Text>{`User "${alert.user_name.trim()}" has Rebooted Node ${alert.access_point_name}`}</Text>
)

const getNetworkMessage = (alert, message = '') => <Text>{`Network ${alert.network_name} ${message}`}</Text>

const getContent = alert => {
  switch (alert.code) {
    case 'AP_GOES_ACTIVE':
      return getApMessage(alert, 'has is now online')
    case 'AP_GOES_INACTIVE':
      return getApMessage(alert, 'has is now offline')
    case 'AP_REBOOTED':
      return getApMessageReboot(alert)
    case 'USER_PASS_REGISTRATION':
      return getUserMessage(alert, 'is registered by invite')
    case 'NETWORK_CREATED':
      return getNetworkMessage(alert, 'has been created')
    case 'NETWORK_DELETED':
      return getNetworkMessage(alert, 'has been deleted', true)
    case 'NETWORK_EDITED':
      return getNetworkMessage(alert, 'has been edited')
    case 'BATTERY_20_PERCENT':
      return getApMessage(alert, 'battery is going down, it is 20% for now')
    case 'LOST_CONNECTION':
      return getApMessage(alert, 'is out of network for 10 minutes')
    case 'BATTERY_10_PERCENT':
      return getApMessage(alert, 'battery is going down, it is 10% for now')
    case 'AP_CREATED':
      return getApMessage(alert, `has been created in network "${alert.network_name}"`)
    case 'AP_EDITED':
      return getApMessage(alert, `has been edited in network "${alert.network_name}"`)
    case 'AP_DELETED':
      return getApMessage(alert, `has been deleted in network "${alert.network_name}"`)
    case 'SSID_CREATED':
      return <Text>{alert.message}</Text>
    case 'SSID_DELETED':
      return <Text>{alert.message}</Text>
    case 'SSID_EDITED':
      return <Text>{alert.message}</Text>
    default:
      return <Text>{alert.message}</Text>
  }
}

export default class Alerts extends PureComponent {
  state = {
    isModalVisible: false,
    optionAction: 0,
    searchQuery: '',
  }

  componentDidMount() {
    this.props.getAlerts()
  }

  getAlertsFiltered = periodInDays => {
    if (periodInDays !== 0) {
      let date_start = new Date()
      const date_end = Math.round(new Date().getTime() / 1000)

      date_start.setDate(date_start.getDate() - periodInDays)
      date_start = Math.round(date_start.getTime() / 1000)

      this.props.getAlerts(date_start, date_end)
    } else {
      this.props.getAlerts()
    }
  }

  toggleModal = () => {
    this.setState(state => ({ isModalVisible: !state.isModalVisible }))
  }

  setOptionAction = optionAction => {
    this.setState({ optionAction, isModalVisible: false }, () => this.getAlertsFiltered(optionAction))
  }

  renderOption = () => {
    const { optionAction } = this.state
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ ...styles.content, backgroundColor: theme.primaryBackground }}>
            <Text numberOfLines={1} style={{ ...styles.subTitle, color: theme.primaryText }}>
              Filter By Date
            </Text>
            <TouchableOpacity
              style={{ ...styles.action, borderColor: theme.primaryBorder }}
              onPress={() => this.setOptionAction(1)}>
              <Text style={{ ...styles.actionText, color: theme.primaryText }}>Last day</Text>
              {optionAction === 1 && <Check color="#1F6BFF" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ ...styles.action, borderColor: theme.primaryBorder }}
              onPress={() => this.setOptionAction(7)}>
              <Text style={{ ...styles.actionText, color: theme.primaryText }}>Last 7 days</Text>
              {optionAction === 7 && <Check color="#1F6BFF" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ ...styles.action, borderColor: theme.primaryBorder }}
              onPress={() => this.setOptionAction(31)}>
              <Text style={{ ...styles.actionText, color: theme.primaryText }}>Last month</Text>
              {optionAction === 31 && <Check color="#1F6BFF" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ ...styles.action, borderColor: theme.primaryBorder }}
              onPress={() => this.setOptionAction(0)}>
              <Text style={{ ...styles.actionText, color: theme.primaryText }}>All time</Text>
              {optionAction === 0 && <Check color="#1F6BFF" size={20} />}
            </TouchableOpacity>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderOptionsModal = () => {
    return (
      <Modal
        useNativeDriver
        hideModalContentWhileAnimating
        style={styles.modal}
        onSwipeComplete={this.toggleModal}
        onBackdropPress={this.toggleModal}
        swipeDirection={['down']}
        isVisible={this.state.isModalVisible}>
        {this.renderOption()}
      </Modal>
    )
  }

  alertTypeBadge = type => (
    <View style={[styles.alertType, styles[type]]}>
      <Text style={styles[type]}>{type}</Text>
    </View>
  )

  render() {
    const { navigation, alerts, archiveAlert, archiveAllAlerts } = this.props
    const filteredAlerts =
      alerts && alerts.length
        ? alerts.reverse().filter(x =>
            JSON.stringify(x)
              .toLowerCase()
              .includes(this.state.searchQuery.toLowerCase()),
          )
        : []
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Alerts" navigation={navigation}>
            {alerts && alerts.length ? (
              <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
                <View style={styles.flex}>
                  <View>
                    <View style={{ ...styles.searchContainer, backgroundColor: theme.primaryBackground }}>
                      <View style={styles.flex}>
                        <FieldBG
                          placeholder="Search"
                          clearButtonMode="always"
                          value={this.state.searchQuery}
                          onChangeText={searchQuery => this.setState({ searchQuery })}
                        />
                      </View>
                      <TouchableOpacity style={[styles.icon, { marginRight: 16 }]} onPress={this.toggleModal}>
                        <Filter size={20} fill="#A3ACBA" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                keyExtractor={item => item.id.toString()}
                data={filteredAlerts}
                renderItem={({
                  item: {
                    id,
                    code = '',
                    user_name = '',
                    network_name = '',
                    access_point_name = '',
                    message,
                    created_at,
                    type,
                  },
                }) => (
                  <View style={{ ...styles.item, backgroundColor: theme.primaryCardBgr }}>
                        <View style={styles.flex}>
                          <View style={styles.alertTypeWrap}>
                        {this.alertTypeBadge(type)}
                        <Text style={styles.userName}>{user_name || network_name || access_point_name}</Text>
                          </View>
                      <Text style={styles.message}>
                        {getContent({
                          id,
                          code,
                          user_name,
                          network_name,
                          access_point_name,
                          message,
                          created_at,
                          type,
                        })}
                      </Text>
                      <Text style={styles.message}>
                        {`${moment
                          .utc(created_at)
                          .local()
                          .format('LTS, LL')}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => archiveAlert(id)}>
                          <View style={{ ...styles.icon, backgroundColor: theme.primaryDarkGray }}>
                            <Archive fill="#A3ACBA" size={20} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                  />
                </View>

                <View style={styles.buttonArchiveAll}>
                  <Button active text="Archive all" onPress={archiveAllAlerts} />
                </View>
                {this.renderOptionsModal()}
              </View>
            ) : (
              <View style={styles.noAlerts}>
                <View style={styles.noAlertsIcon}>
                  <NoNewAlerts />
                </View>
                <Text style={styles.noAlertsTitle}>No new alerts at this time</Text>
              </View>
            )}
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    justifyContent: 'space-between',
  },
  content: {
    // backgroundColor: 'white',
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  flex: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignContent: 'stretch',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  subTitle: {
    marginVertical: 12,
    fontSize: 22,
    color: '#101114',
  },
  item: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#1F6BFF',
    fontSize: 16,
  },
  message: {
    color: '#8F97A3',
    fontSize: 12,
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: '#CBD2DE',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  action: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  actionText: {
    fontSize: 18,
    // marginLeft: 24,
    // color: '#101114',
  },
  buttonArchiveAll: {
    marginTop: 20,
  },
  icon: {
    // backgroundColor: '#F5F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    aspectRatio: 1,
    height: 36,
    width: 36,
  },
  alertType: {
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  INFO: {
    fontWeight: '500',
    borderColor: '#00B860',
    color: '#00B860',
  },
  WARNING: {
    fontWeight: '500',
    borderColor: 'orange',
    color: 'orange',
  },
  ERROR: {
    fontWeight: '500',
    borderColor: 'red',
    color: 'red',
  },
  alertTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'center',
    alignItems: 'baseline',
  },
  noAlerts: {
    flex: 1,
    marginTop: 60,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  noAlertsTitle: {
    fontSize: 24,
    lineHeight: 32,
    color: '#101114',
  },
  noAlertsIcon: {
    padding: 48,
  },
})

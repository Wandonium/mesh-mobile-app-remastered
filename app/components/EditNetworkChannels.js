import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native'
import Modal from 'react-native-modal'
import { cloneDeep } from 'lodash'
import Switch from './Switch'
import Button from './Button'
import SelectBox from './SelectBox'
import DefaultHeaderHOC from './DefaultHeaderHOC'
import { ManageThemeContext } from '../theme/ThemeManager'
import channelsConfig from '../constants/channels.config'
import { AlertHelper, makeDataByFrequency, getChannelsSuggestions, getGroupedNoises } from '../services'

const ACTION_SHEET_TYPE_BANDWIDTH = 'ACTION_SHEET_TYPE_BANDWIDTH'
const ACTION_SHEET_TYPE_CHANNEL = 'ACTION_SHEET_TYPE_CHANNEL'
const BANDWIDTH_2_4 = '2.4 GHz'
const BANDWIDTH_5 = '5 GHz'
const CHANNEL_2_4 = '2.4 GHz'
const CHANNEL_5 = '5 GHz'
const bandwidthArr_2_4 = [20, 40]
const channelsArr_2_4 = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [3]]
const bandwidthArr_5 = [20, 40, 80]
const channelsArr_5 = [
  [36, 40, 44, 48, 149, 153, 157, 161, 165],
  [38, 46, 151, 159],
  [42, 155],
]

const defaultChannelsData = {
  configuration: false,
  channel_bandwidth_2_4_ghz: 20,
  channel_bandwidth_5_ghz: 80,
  channel_2_4_ghz: 11,
  channel_5_ghz: 155,
}

const getBest = (noiseArray, currentSuggestions) => {
  let best = false
  noiseArray.forEach((overlapItem) => {
    if (currentSuggestions.includes(overlapItem.overlapChannel)) {
      const tmp = cloneDeep(overlapItem)
      if ([1, 6, 11].includes(tmp.overlapChannel)) {
        tmp.noise += 10 // priority for 1, 6, 11 channels
      }
      if (!best) {
        best = tmp
      } else if (best.noise < tmp.noise) {
        best = tmp
      }
    }
  })
  return best
}

const getScanData = (networkData) => {
  if (networkData.aps) {
    const { noise2, noise5, unsignedNoise5G, unsignedNoise2G } = makeDataByFrequency(networkData.aps)
    if (!noise2 || !noise5) return { best2: false, best5: false }

    const suggestions = getChannelsSuggestions()
    const bandwidth2G = networkData.channel_bandwidth_2_4_ghz
    const bandwidth5G = networkData.channel_bandwidth_5_ghz

    const network2G = '2.4GHz'
    const network5G = '5GHz'

    const channelCfg2 = channelsConfig[network2G][bandwidth2G]
    const channelCfg5 = channelsConfig[network5G][bandwidth5G]

    const noiseArray2 = getGroupedNoises(network2G, bandwidth2G, unsignedNoise5G, unsignedNoise2G)
    const noiseArray5 = getGroupedNoises(network5G, bandwidth5G, unsignedNoise5G, unsignedNoise2G)

    const currentSuggestions2 = suggestions[network2G].filter((item) => channelCfg2.includes(item))
    const currentSuggestions5 = suggestions[network5G].filter((item) => channelCfg5.includes(item))

    const best2 = getBest(noiseArray2, currentSuggestions2)
    const best5 = getBest(noiseArray5, currentSuggestions5)

    return { best2, best5 }
  }
  return { best2: false, best5: false }
}

export default class EditNetworkChannels extends PureComponent {
  best2 = false

  best5 = false

  state = {
    ...(this.props.network ? this.props.network : defaultChannelsData),

    isModalVisible: false,
    actionSheetType: ACTION_SHEET_TYPE_BANDWIDTH,
    selectedBandwidthType: BANDWIDTH_2_4,
    selectedChannelType: CHANNEL_2_4,
    isInfoVisible: false,
    // eslint-disable-next-line react/no-unused-state
    isChannelScanProcessFinish: false,
  }

  componentDidMount() {
    if (this.props.network) {
      const { best2, best5 } = getScanData(this.props.network)
      if (best2 && best5) {
        this.best2 = best2
        this.best5 = best5

        if (!this.state.configuration) {
          const autoConfig = {
            channel_2_4_ghz: this.best2.overlapChannel,
            channel_5_ghz: this.best5.overlapChannel,
          }
          this.setState({ ...autoConfig })
        }
      } else if (!this.state.configuration && this.props.network.total_ap) {
        this.setState(
          {
            isChannelScanProcess: true,
          },
          () => {
            if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
            this.ChannelScanProcessTimer = setTimeout(() => {
              this.setState({
                // eslint-disable-next-line react/no-unused-state
                isChannelScanProcessFinish: true,
                isChannelScanProcess: false,
                ...defaultChannelsData,
              })
            }, 20000)
            this.props.channelScan(this.props.network.id, false)
          },
        )
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState) {
    if (this.props.network && prevProps.network) {
      const { last_scan_date } = this.props.network
      const { last_scan_date: prevLast_scan_date } = prevProps.network

      if (prevLast_scan_date !== last_scan_date) {
        if (this.ChannelScanProcessTimer) {
          clearTimeout(this.ChannelScanProcessTimer)
        }

        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          // eslint-disable-next-line react/no-unused-state
          isChannelScanProcessFinish: true,
          isChannelScanProcess: false,
        })

        const { best2, best5 } = getScanData(this.props.network)
        if (best2 && best5) {
          this.best2 = best2
          this.best5 = best5
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
  }

  channelScanFinished = () => {
    if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
    this.setState(
      {
        isChannelScanProcess: false,
        // eslint-disable-next-line react/no-unused-state
        isChannelScanProcessFinish: false,
      },
      () => AlertHelper.alert('success', 'Success', 'Channel scan completed successfully'),
    )
  }

  toggleManualConfiguration = () => {
    const { network = defaultChannelsData } = this.props
    const { channel_2_4_ghz, channel_5_ghz, channel_bandwidth_2_4_ghz, channel_bandwidth_5_ghz } = network

    if (this.state.configuration) {
      if (
        (!this.best2 || !this.best5) &&
        this.props.network &&
        this.props.network.total_ap &&
        !this.state.isChannelScanProcess
      ) {
        this.setState(
          {
            isChannelScanProcess: true,
          },
          () => {
            if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
            this.ChannelScanProcessTimer = setTimeout(() => {
              this.setState({
                // eslint-disable-next-line react/no-unused-state
                isChannelScanProcessFinish: true,
                isChannelScanProcess: false,
                ...defaultChannelsData,
              })
            }, 20000)
            this.props.channelScan(this.props.network.id, false)
          },
        )
      }
      const autoConfig = {
        channel_2_4_ghz: this.best2 ? this.best2.overlapChannel : channel_2_4_ghz,
        channel_5_ghz: this.best5 ? this.best5.overlapChannel : channel_5_ghz,
        channel_bandwidth_2_4_ghz,
        channel_bandwidth_5_ghz,
      }
      this.setState({ ...defaultChannelsData, ...autoConfig })
    } else {
      this.setState(() => ({
        configuration: true,
        channel_2_4_ghz,
        channel_5_ghz,
        channel_bandwidth_2_4_ghz,
        channel_bandwidth_5_ghz,
      }))
    }
  }

  toggleModal = () => {
    this.setState((state) => ({ isModalVisible: !state.isModalVisible }))
  }

  toggleInfoModal = () => {
    this.setState((state) => ({ isInfoVisible: !state.isInfoVisible }))
  }

  onSave = () => {
    const { network, navigation, editNetwork } = this.props
    const {
      configuration,
      channel_2_4_ghz,
      channel_bandwidth_2_4_ghz,
      channel_5_ghz,
      channel_bandwidth_5_ghz,
    } = this.state

    editNetwork({
      id: network.id,
      configuration,
      channel_2_4_ghz,
      channel_bandwidth_2_4_ghz,
      channel_5_ghz,
      channel_bandwidth_5_ghz,
    })
    navigation.goBack()
  }

  createNetwork = () => {
    const { networkName: name, latitude: lat, longitude: lng, full_address } = this.props.newNetworkData

    if (name.trim() === '') {
      AlertHelper.alert('info', 'Alert', "Network Name can't be empty")
      return
    }

    if (full_address.trim() === '') {
      AlertHelper.alert('info', 'Alert', "Network Address can't be empty")
      return
    }

    const newNetworkData = { name, lat, lng, full_address }
    const {
      configuration,
      channel_2_4_ghz,
      channel_bandwidth_2_4_ghz,
      channel_5_ghz,
      channel_bandwidth_5_ghz,
    } = this.state

    const { navigation, createNetwork } = this.props
    createNetwork(navigation, {
      ...newNetworkData,
      configuration,
      channel_2_4_ghz,
      channel_bandwidth_2_4_ghz,
      channel_5_ghz,
      channel_bandwidth_5_ghz,
    })
  }

  manualSelectType = (type, value) => {
    if (this.state.configuration) {
      this.setState(
        {
          actionSheetType: type === 'channel' ? ACTION_SHEET_TYPE_CHANNEL : ACTION_SHEET_TYPE_BANDWIDTH,
          [type === 'channel' ? 'selectedChannelType' : 'selectedBandwidthType']: value,
        },
        this.toggleModal,
      )
    }
  }

  selectOption = (value) => {
    const { actionSheetType, selectedBandwidthType, selectedChannelType } = this.state

    if (actionSheetType === ACTION_SHEET_TYPE_BANDWIDTH) {
      if (selectedBandwidthType === BANDWIDTH_2_4)
        this.setState({
          channel_bandwidth_2_4_ghz: value,
          channel_2_4_ghz: channelsArr_2_4[bandwidthArr_2_4.indexOf(value)][0],
          isModalVisible: false,
        })
      else
        this.setState({
          channel_bandwidth_5_ghz: value,
          channel_5_ghz: channelsArr_5[bandwidthArr_5.indexOf(value)][0],
          isModalVisible: false,
        })
    } else if (selectedChannelType === CHANNEL_2_4)
      this.setState({
        channel_2_4_ghz: value,
        isModalVisible: false,
      })
    else
      this.setState({
        channel_5_ghz: value,
        isModalVisible: false,
      })
  }

  renderModal = () => {
    const {
      actionSheetType,
      selectedBandwidthType,
      selectedChannelType,
      channel_bandwidth_2_4_ghz,
      channel_bandwidth_5_ghz,
      isModalVisible,
    } = this.state

    let options
    if (actionSheetType === ACTION_SHEET_TYPE_BANDWIDTH) {
      if (selectedBandwidthType === BANDWIDTH_2_4) options = bandwidthArr_2_4
      else options = bandwidthArr_5
    } else if (selectedChannelType === CHANNEL_2_4)
      options = channelsArr_2_4[bandwidthArr_2_4.indexOf(channel_bandwidth_2_4_ghz)]
    else options = channelsArr_5[bandwidthArr_5.indexOf(channel_bandwidth_5_ghz)]

    let modalHeight = (options.length + 1) * 48
    if (modalHeight > Dimensions.get('window').height / 2) modalHeight = Dimensions.get('window').height * 0.5

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Modal
            propagateSwipe
            useNativeDriver
            hideModalContentWhileAnimating
            isVisible={isModalVisible}
            style={styles.bottomModal}
            onSwipeComplete={() => this.setState({ isModalVisible: false })}
            swipeDirection={['down']}
            onBackdropPress={this.toggleModal}>
            <View
              style={[
                { ...styles.bottomModalContainer, backgroundColor: theme.primaryBackground },
                { height: modalHeight },
              ]}>
              <ScrollView>
                {options.map((value, id) => (
                  <TouchableOpacity
                    key={id}
                    style={{ ...styles.bottomModalOption, backgroundColor: theme.primaryCardBgr }}
                    onPress={() => this.selectOption(value)}>
                    <Text style={{ ...styles.bottomOptionValue, color: theme.primaryText }}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Modal>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderInfoModal = () => {
    const { isInfoVisible } = this.state

    return (
      <Modal
        useNativeDriver
        hideModalContentWhileAnimating
        propagateSwipe
        animationIn="slideInDown"
        animationOut="slideOutUp"
        isVisible={isInfoVisible}
        style={styles.infoModal}
        onSwipeComplete={() => this.setState({ isInfoVisible: false })}
        swipeDirection={['down', 'up']}
        backdropColor="#FFF"
        onBackdropPress={this.toggleInfoModal}>
        <View style={styles.infoModalContainer}>
          <Text style={styles.infoText}>
            Automatic configuration will use the latest channel scan data for this network to configure the channel and
            bandwidth settings.
          </Text>
        </View>
      </Modal>
    )
  }

  mainContainer = () => {
    const {
      configuration,
      channel_bandwidth_2_4_ghz,
      channel_2_4_ghz,
      channel_bandwidth_5_ghz,
      channel_5_ghz,
      isChannelScanProcess,
    } = this.state
    const { createNetwork } = this.props

    const isChanged = this.props.network
      ? configuration !== this.props.network.configuration ||
        channel_bandwidth_2_4_ghz !== this.props.network.channel_bandwidth_2_4_ghz ||
        channel_2_4_ghz !== this.props.network.channel_2_4_ghz ||
        channel_bandwidth_5_ghz !== this.props.network.channel_bandwidth_5_ghz ||
        channel_5_ghz !== this.props.network.channel_5_ghz
      : true

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
            {this.renderModal()}

            <View>
              <Text style={{ ...styles.sectionTitle, color: theme.primaryText }}>Configuration</Text>

              <View
                style={{ ...styles.section, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                <View style={styles.sitchWrap}>
                  <Switch label="Manual" value={configuration} onValueChange={this.toggleManualConfiguration} />
                </View>

                <SelectBox
                  title="Bandwidth 2.4 GHz"
                  // rightText={channel_bandwidth_2_4_ghz}
                  rightText={configuration ? channel_bandwidth_2_4_ghz : ` ${channel_bandwidth_2_4_ghz} (auto)`}
                  rightTextColor={configuration ? '#484C52' : '#2550D9'}
                  onPress={() => this.manualSelectType('bandwidth', BANDWIDTH_2_4)}
                />

                <SelectBox
                  title="Channel 2.4 GHz"
                  // rightText={channel_2_4_ghz}
                  rightText={configuration ? channel_2_4_ghz : ` ${channel_2_4_ghz} (auto)`}
                  rightTextColor={configuration ? '#484C52' : '#2550D9'}
                  onPress={() => this.manualSelectType('channel', CHANNEL_2_4)}
                />

                <SelectBox
                  title="Bandwidth 5 GHz"
                  rightText={configuration ? channel_bandwidth_5_ghz : ` ${channel_bandwidth_5_ghz} (auto)`}
                  rightTextColor={configuration ? '#484C52' : '#2550D9'}
                  onPress={() => this.manualSelectType('bandwidth', BANDWIDTH_5)}
                />

                <SelectBox
                  disableBorderBottom
                  title="Channel 5 GHz"
                  // rightText={channel_5_ghz}
                  rightText={configuration ? channel_5_ghz : ` ${channel_5_ghz} (auto)`}
                  rightTextColor={configuration ? '#484C52' : '#2550D9'}
                  onPress={() => this.manualSelectType('channel', CHANNEL_5)}
                />
              </View>
              {isChannelScanProcess && !configuration && (
                <View style={styles.scanWrap}>
                  <ActivityIndicator animating={isChannelScanProcess} />
                  <Text style={styles.hint}>Channel scan in progress</Text>
                </View>
              )}
              {!configuration && this.best2 && this.best5 && (
                <View style={styles.hintWrap}>
                  <Text style={styles.hint}>
                    Automatic configuration will use the latest channel scan data for this network to configure the
                    channel and bandwidth settings.
                  </Text>
                </View>
              )}
            </View>
            {isChanged && (
              <Button
                active
                testID="EditNetworkChannelsButton"
                text={createNetwork ? 'Create' : 'Save'}
                onPress={createNetwork ? this.createNetwork : this.onSave}
              />
            )}
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  render() {
    const { navigation, createNetwork } = this.props

    if (createNetwork) {
      return this.mainContainer()
    }

    return (
      <DefaultHeaderHOC title="Channels and Bandwidth" navigation={navigation}>
        {this.mainContainer()}
      </DefaultHeaderHOC>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F5F9FF',
  },
  // infoIcon: {
  //   height: 16,
  //   width: 16,
  //   aspectRatio: 1,
  //   borderRadius: 16,
  //   marginLeft: 8,
  //   backgroundColor: '#1F6BFF',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  infoText: {
    fontSize: 14,
    // textAlign: 'justify',
  },
  // question: {
  //   color: '#FFF',
  //   fontSize: 12,
  // },
  sitchWrap: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  infoModal: {
    justifyContent: 'flex-start',
    margin: 24,
    marginTop: 160,
  },
  infoModalContainer: {
    maxHeight: '50%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'space-around',
    shadowColor: '#1C1F2E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.13,
    shadowRadius: 31,
    elevation: 12,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomModalContainer: {
    maxHeight: '50%',
    paddingBottom: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'space-around',
  },
  bottomModalOption: {
    width: '100%',
    height: 48,
    justifyContent: 'space-around',
    borderBottomColor: '#CBD2DE',
    borderBottomWidth: 1,
  },
  bottomOptionValue: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
  },
  scanWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    color: '#666F7A',
    fontSize: 12,
    marginHorizontal: 16,
    fontWeight: '500',
  },
})

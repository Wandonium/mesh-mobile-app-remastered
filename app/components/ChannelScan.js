import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native'
import { Text as SvgText } from 'react-native-svg'
import { cloneDeep, isEqual } from 'lodash'
import moment from 'moment'
import channelsConfig from '../constants/channels.config'
import Button from './Button'
import ChannelChart from './ChannelChart'
import SegmentedControlTab from './SegmentedControlTab'
import DefaultHeaderHOC from './DefaultHeaderHOC'
import { AlertHelper, makeDataByFrequency, getChannelsSuggestions, getGroupedNoises } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'

const { width: screenWidth } = Dimensions.get('window')
const channels5 = [
  36,
  40,
  44,
  48,
  52,
  56,
  60,
  64,
  100,
  104,
  108,
  112,
  116,
  120,
  124,
  128,
  132,
  136,
  140,
  144,
  149,
  153,
  157,
  161,
  165,
]
// const channels5 = [ 36, 38, 40, 42, 44, 46, 48, 52, 54, 56, 58, 60, 62, 64, 100, 102, 104, 106, 108, 110, 112, 116, 118, 120, 122, 124, 126, 128, 132, 134, 136, 138, 140, 142, 144, 149, 151, 153, 155, 157, 159, 161, 165]

const channels2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export default class ChannelScan extends PureComponent {
  state = {
    ...this.props.network,
    unsignedNoise5G: [],
    unsignedNoise2G: [],
    noise2: null,
    noise5: null,
    data: [],
    changeBan: 0,
    isChannelScanProcessFinish: false,
    isChannelScanProcess: false,
  }

  componentDidMount() {
    const { aps, last_scan_date } = this.props.network

    if (aps.length > 0) {
      this.setState(makeDataByFrequency(aps), this.setData)

      if (
        this.props.needScan &&
        (!last_scan_date || (last_scan_date && +moment(last_scan_date, 'X').format('X') + 3600 < +moment().format('X')))
      ) {
        this.scanAgain()
      }
    }
  }

  componentWillUnmount() {
    if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('[ChannelScan.js] - componentDidUpdate', this.props.network.aps.length)
    const { aps, last_scan_date } = this.props.network
    const { aps: prevAps, last_scan_date: prevLast_scan_date } = prevProps.network
    const { isChannelScanProcess } = this.state

    if (aps.length > 0 && prevState.changeBan !== this.state.changeBan) {
      this.setData()
    }
    if (!isEqual(prevLast_scan_date, last_scan_date) && isChannelScanProcess) {
      this.channelScanFinished()
    }
    if (!isEqual(prevAps, aps) || this.state.unsignedNoise5G.length === 0) {
      this.setState(makeDataByFrequency(aps), this.setData)
    }
  }

  channelScanStarted = () => {
    this.setState({
      isChannelScanProcess: true,
    })
    if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
    this.ChannelScanProcessTimer = setTimeout(() => {
      this.setState(
        {
          isChannelScanProcessFinish: true,
          isChannelScanProcess: false,
        },
        () => AlertHelper.alert('warning', 'Warning', "Sorry, we didn't receive any data"),
      )
    }, 90000)
  }

  channelScanFinished = () => {
    if (this.ChannelScanProcessTimer) clearTimeout(this.ChannelScanProcessTimer)
    this.setState(
      {
        isChannelScanProcess: false,
        isChannelScanProcessFinish: false,
      },
      () => AlertHelper.alert('success', 'Success', 'Channel scan completed successfully'),
    )
  }

  handleIndexChange = (index) => {
    this.setState({ changeBan: index })
  }

  /**
   * set data for draw chart
   */
  setData = () => {
    const { changeBan, unsignedNoise5G, unsignedNoise2G } = this.state
    const { network: networkData } = this.props
    const suggestions = getChannelsSuggestions()
    const bandwidth2G = networkData.channel_bandwidth_2_4_ghz
    const bandwidth5G = networkData.channel_bandwidth_5_ghz
    const channel2G = networkData.channel_2_4_ghz
    const channel5G = networkData.channel_5_ghz

    let network = '2.4GHz'
    let channel = channel2G
    let bandwidth = bandwidth2G
    if (changeBan) {
      network = '5GHz'
      channel = channel5G
      bandwidth = bandwidth5G
    }
    const channelCfg = channelsConfig[network][bandwidth]
    const noiseArray = getGroupedNoises(network, bandwidth, unsignedNoise5G, unsignedNoise2G)
    const currentSuggestions = suggestions[network].filter((item) => channelCfg.includes(item))
    let best = false
    noiseArray.forEach((overlapItem) => {
      if (currentSuggestions.indexOf(overlapItem.overlapChannel) !== -1) {
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
    const newData = []
    const channels = changeBan ? channels5 : channels2

    this.biggest = 0

    channels.forEach((ch, i) => {
      newData.push({
        channel: ch,
        bandwidth,
        value: 100 - (changeBan ? unsignedNoise5G[i] : unsignedNoise2G[i]),
        textValue: changeBan ? unsignedNoise5G[i] : unsignedNoise2G[i],
        svg: { fill: [...suggestions['2.4GHz'], ...suggestions['5GHz']].includes(ch) ? '#006FC0' : '#A5A5A5' },
      })
      if (this.biggest < 100 - (changeBan ? unsignedNoise5G[i] : unsignedNoise2G[i])) {
        this.biggest = Math.floor(100 - (changeBan ? unsignedNoise5G[i] : unsignedNoise2G[i]))
      }
    })
    this.best = best
    this.currChannel = channel
    this.bandwidth = bandwidth
    this.network = network
    if (this.best) {
      // this.setAreaCoords(best, changeBan, channels)
      this.setAreaColors(changeBan, networkData, best, channelCfg, suggestions)
    }
    this.makeAxis()
    this.setState({
      data: newData,
    })
  }

  setAreaColors = (changeBan, networkData, best, channelCfg, suggestions) => {
    this.bestStrokeColor = '#007BC8'
    if (
      (changeBan && networkData.channel_5_ghz === best.overlapChannel) ||
      (!changeBan && networkData.channel_2_4_ghz === best.overlapChannel)
    )
      this.bestStrokeColor = '#008000'

    if (
      [...suggestions['2.4GHz'], ...suggestions['5GHz']].includes(best.overlapChannel) &&
      channelCfg.includes(best.overlapChannel)
    ) {
      this.bestColor = '#00B0F0'
    } else {
      this.bestColor = '#A5A5A580'
    }
  }

  makeAxis = () => {
    let axis = [0, -20, -40, -60, -80, -100]
    this.biggestY = 100
    if (100 - this.biggest !== 100) {
      if (100 - this.biggest >= 20) {
        axis = [-20, -40, -60, -80, -100]
        this.biggestY = 100 - 20
      }
      if (100 - this.biggest >= 30) {
        axis = [-30, -65, -100]
        this.biggestY = 100 - 30
      }
      if (100 - this.biggest >= 40) {
        axis = [-40, -60, -80, -100]
        this.biggestY = 100 - 40
      }
      if (100 - this.biggest >= 50) {
        axis = [-50, -75, -100]
        this.biggestY = 100 - 50
      }
    }
    return axis
  }

  applyChannel = () => {
    const { editNetwork, network, network: networkData, navigation } = this.props
    const { changeBan } = this.state
    const data = {
      id: network.id,
      configuration: true,
      channel_2_4_ghz: !changeBan ? this.best.overlapChannel : networkData.channel_2_4_ghz,
      channel_bandwidth_2_4_ghz: networkData.channel_bandwidth_2_4_ghz,
      channel_5_ghz: changeBan ? this.best.overlapChannel : networkData.channel_5_ghz,
      channel_bandwidth_5_ghz: networkData.channel_bandwidth_5_ghz,
    }
    editNetwork(data)
    navigation.goBack(null)
  }

  scanAgain = () => {
    const { network, channelScan } = this.props
    this.channelScanStarted()
    channelScan(network.id)
    this.setState(makeDataByFrequency(network.aps), this.setData)
  }

  render() {
    const { data, changeBan, noise2, noise5, isChannelScanProcess } = this.state
    const { navigation } = this.props
    const { best, bandwidth, currChannel } = this
    let bestChannel = null
    if (best) {
      bestChannel = best.overlapChannel
      const bestIndex = data.findIndex((item) => item.channel === bestChannel)
      if (bestIndex >= 0) {
        best.bestIndex = bestIndex
        const currChannelIndex = data.findIndex((item) => item.channel === currChannel)
        if (data[currChannelIndex]) data[currChannelIndex].svg = { fill: '#00B860' }
      }
    }
    const Label = ({ x, y, bandwidth: band }) => (
      <SvgText
        x={x(best.overlapChannel - 1) + band / 2}
        y={y(data[best.overlapChannel - 1].value) + 15}
        fontSize={10}
        fill="black"
        alignmentBaseline="middle"
        textAnchor="middle">
        {`Channel\n${best.overlapChannel}\n@${bandwidth}MHz`}
      </SvgText>
    )
    const offset = data.length > 14 ? 20 : (screenWidth - 80) / data.length
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Channel Scan" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <View style={[styles.wrapper, styles.segmentedTabs]}>
                <SegmentedControlTab
                  values={['2.4GHz', '5GHz']}
                  selectedIndex={changeBan}
                  onTabPress={this.handleIndexChange}
                />
              </View>

              <View
                style={{ ...styles.section, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder }}>
                {data && data.length && noise2 && noise5 ? (
                  <View style={{ flex: 1 }}>
                    <ChannelChart
                      data={data}
                      currChannel={currChannel}
                      bestData={best}
                      biggestY={this.biggestY}
                      biggest={this.biggest}
                      Label={Label}
                      xLabels={changeBan ? channels5 : channels2}
                      offset={offset}
                    />

                    <View style={styles.chartLegend}>
                      <Text style={styles.currentChannel}>Current channel: {currChannel}</Text>
                      {bestChannel && currChannel !== bestChannel && (
                        <Text style={styles.recomendedChannel}>Recommended channel: {bestChannel}</Text>
                      )}
                    </View>
                    {isChannelScanProcess && (
                      <View style={styles.indicatorWrapper}>
                        <ActivityIndicator size="large" color="white" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.noDataWrapper}>
                    {isChannelScanProcess ? (
                      <ActivityIndicator size="large" color="#1F6BFF" />
                    ) : (
                      <Text style={{ ...styles.noDataText, color: theme.primaryText }}>No data available</Text>
                    )}
                  </View>
                )}
              </View>
              <View>
                <View style={styles.wrapper} />
                {best && noise2 && noise5 && (
                  <Button
                    active={bestChannel !== currChannel && !isChannelScanProcess}
                    disabled={bestChannel === currChannel || isChannelScanProcess}
                    testID="ApplyChannelButton"
                    text={`Apply channel ${bestChannel} @${bandwidth}MHz`}
                    onPress={this.applyChannel}
                  />
                )}
                <Button
                  disabled={isChannelScanProcess}
                  active={!isChannelScanProcess}
                  testID="ScanChannelAgainButton"
                  text="Scan again"
                  onPress={this.scanAgain}
                />
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
    backgroundColor: '#F5F9FF',
  },
  wrapper: {
    paddingHorizontal: 16,
  },
  noDataWrapper: {
    height: 250,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 22,
    fontWeight: '300',
    alignSelf: 'center',
  },
  indicatorWrapper: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    alignContent: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  currentChannel: {
    color: '#00B860',
  },
  recomendedChannel: {
    color: '#007BC8',
  },
  segmentedTabs: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  section: {
    flex: 1,
    marginTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
    marginBottom: 16,
  },
})

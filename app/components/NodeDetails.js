import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, Alert, Dimensions } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { Battery, Users, Throughput, Reboot, Edit, Delete } from './svg'
import { Chart } from '../containers'
import { ManageThemeContext } from '../theme/ThemeManager'

const headerHeight = 120
const window = Dimensions.get('window')

export default class NodeDetails extends PureComponent {
  actionWithNode = (id, action) => {
    Alert.alert(
      'Warning',
      `Are you sure you want to ${action} this node?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            this.props.actionWithNode(id, action)
          },
        },
      ],
      { cancelable: false },
    )
  }

  getChartData = (chart) => {
    return chart && chart.stats
      ? chart.stats.map((el) => {
          return {
            download: Number(el.download),
            upload: Number(el.upload),
            created_at: el.created_at,
          }
        })
      : []
    // stats
    //   .map((el, i) => chart.map(e => e?.stats && e.stats[i]))
    //   .map(el => {
    //     return {
    //       download: Number(el[0].download),
    //       upload: Number(el[0].upload),
    //       created_at: el[0].created_at,
    //     }
    //   })
  }

  render() {
    const {
      actionWithNode,
      node,
      isAdmin,
      getNetworkStatistic,
      getNetworkHistory,
      networkStatistic,
      network,
      selectedPeriod,
      setRequestTimeRangeInterval,
      maxScrollHeight = window.height - headerHeight - 70,
    } = this.props

    const { id, battery = 0, clients, downloadRate, uploadRate, mac, nearest, status } = node
    const chart = id ? networkStatistic.chart.find((x) => x.id === id) : []
    const chartData = this.getChartData(chart)
    const nodeStatistic = { chart: [chart], chartData }

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={[styles.container, { maxHeight: maxScrollHeight }]}>
            <ScrollView>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.content}>
                  <View style={styles.section}>
                    <View style={styles.nodeInfo}>
                      <Battery size={26} percent={battery} />
                      <Text style={{ ...styles.nodeInfoText, color: theme.primaryText }}>{battery}%</Text>
                    </View>
                    <View style={styles.nodeInfo}>
                      <Users />
                      <Text style={{ ...styles.nodeInfoText, color: theme.primaryText }}>{clients}</Text>
                    </View>
                    <View style={styles.nodeInfo}>
                      <Throughput />
                      <Text style={{ ...styles.nodeInfoText, color: theme.primaryText }}>
                        <Text>{Math.round(downloadRate)}↓</Text>
                        <Text>/</Text>
                        <Text>{Math.round(uploadRate)}↑</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.nodeHardInfo}>
                    <View style={styles.nodeHardInfoItem}>
                      <Text style={styles.nodeHardInfoTitle}>Connection type</Text>
                      <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>Ethernet</Text>
                    </View>
                    <View style={styles.nodeHardInfoItem}>
                      <Text style={styles.nodeHardInfoTitle}>Nearest Gateway</Text>
                      <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>{nearest}</Text>
                    </View>
                    <View style={styles.nodeHardInfoItem}>
                      <Text style={styles.nodeHardInfoTitle}>MAC Address</Text>
                      <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>{mac.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.chartWrapper}>
                  {nodeStatistic.chart && (
                    <Chart
                      nodeId={id}
                      network={network}
                      selectedPeriod={selectedPeriod}
                      getNetworkHistory={getNetworkHistory}
                      networkStatistic={nodeStatistic}
                      getNetworkStatistic={getNetworkStatistic}
                      navigate={this.props.navigation.navigate}
                      setRequestTimeRangeInterval={setRequestTimeRangeInterval}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </ScrollView>
            {isAdmin && (
              <View style={{ ...styles.footer }}>
                <TouchableOpacity
                  onPress={() => this.actionWithNode(node, 'reboot')}
                  disabled={status !== 'Active'}
                  style={[
                    {
                      ...styles.action,
                      backgroundColor: theme.primaryButtonGray,
                    },
                    status !== 'Active' && styles.disabledAction,
                  ]}>
                  <Reboot />
                  <Text style={styles.actionName}>Reboot</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => actionWithNode(node, 'edit')}
                  style={{ ...styles.action, backgroundColor: theme.primaryButtonGray }}>
                  <Edit />
                  <Text style={styles.actionName}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.actionWithNode(node, 'delete')}
                  style={{ ...styles.action, backgroundColor: theme.primaryButtonGray }}>
                  <Delete />
                  <Text style={styles.actionName}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: 'space-between',
    // maxHeight: maxSheetHeight,
  },
  content: {
    paddingHorizontal: 16,
  },
  chartWrapper: {
    // marginBottom: 100,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  nodeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeInfoText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  nodeHardInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nodeHardInfoItem: {
    width: '50%',
    marginBottom: 15,
  },
  nodeHardInfoTitle: {
    fontSize: 12,
    color: '#8F97A3',
  },
  nodeHardInfoValue: {
    marginTop: 5,
    fontSize: 18,
    color: '#101114',
  },
  footer: {
    paddingVertical: 10,
    // position: 'absolute',
    // bottom: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#CED5E0',
  },
  action: {
    marginHorizontal: 6,
    height: 40,
    width: Dimensions.get('screen').width / 3 - 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAction: {
    opacity: 0.5,
  },
  actionName: {
    color: '#1F6BFF',
    fontSize: 16,
    marginLeft: 8,
  },
})

import ReactNativeZoomableView from '@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView'
import { isEqual } from 'lodash'
import moment from 'moment'
import React, { createRef, PureComponent } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View, FlatList } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { LineChart, XAxis, YAxis } from 'react-native-svg-charts'
import { ManageThemeContext } from '../../theme/ThemeManager'
import CustomGrid from '../CustomGrid'
import HistoryChart from '../HistoryChart'
// import SegmentedControl from '@react-native-community/segmented-control'
import SegmentedControl from '../SegmentedControl'
import RenderPaginationItem from './RenderPaginationItem'

const { width: deviceWidth } = Dimensions.get('window')
const gatewaySliderWidth = deviceWidth - 42 * 2

const contentInset = { left: 0, right: 0, top: 10, bottom: 0 }
// const contentInsetSecond = { left: 0, right: 0, top: 0, bottom: 15 }

const contentInsetVertical = { top: 10, bottom: 20 }

const axesSvg = { fontSize: 10, fill: 'grey' }

const uploadStyle = { stroke: '#1F6BFF', strokeWidth: 2 }
const downloadStyle = { stroke: '#00B860', strokeWidth: 2 }

// const capacityStyle = { fill: '#c5e0b4', fillOpacity: 0.5 }
// const throughputStyle = { fill: '#c55a10', fillOpacity: 0.5 }

// const uploadFillStyle = { fill: '#1F6BFF', fillOpacity: 0.5 }
// const downloadFillStyle = { fill: '#00B860', fillOpacity: 0.5 }

// const utilizationUpStyle = { fill: 'rgba(0, 65, 244, 0.2)' }
// const utilizationDownStyle = { fill: 'rgba(134, 0, 244, 0.2)' }

// const graphList = ['Overview', 'Capacity', 'Utilization']
const periodList = ['Last 2 hours', 'Last day', 'Last month']
const hoursList = [2, 24, 720]

export default class Chart extends PureComponent {
  constructor() {
    super()
    this._flatlistRef = createRef()
  }

  state = {
    data: [],
    allData: [],
    overviewCapacity: [],
    overviewThroughput: [],
    overviewUtilizationData: [],
    selectedPeriod: 0,
    chartZoomLevel: 1,
    currentPageNum: 0,
  }

  onScrollEnd = ({ nativeEvent }) => {
    const pageNum = Math.floor(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width)
    this._flatlistRef.current?.scrollToIndex({ index: pageNum + 2, animated: true })
    this.setState({ currentPageNum: pageNum })
  }

  componentDidMount() {
    const { network, getNetworkHistory, getNetworkStatistic } = this.props
    getNetworkHistory(network.id)
    getNetworkStatistic(network.id)
  }

  static getDerivedStateFromProps({ networkStatistic }, prevState) {
    const { overviewCapacity, overviewThroughput, allData, chartData, overviewUtilizationData } = networkStatistic
    const { overviewCapacity: prevOverviewCapacity, overviewThroughput: prevOverviewThroughput } = prevState
    if (!isEqual(overviewCapacity, prevOverviewCapacity) || !isEqual(overviewThroughput, prevOverviewThroughput)) {
      return {
        ...prevState,
        overviewCapacity,
        overviewThroughput,
        allData,
        data: chartData,
        overviewUtilizationData,
      }
    }
    return null
  }

  handleIndexChange = (index) => {
    const { getNetworkStatistic, network } = this.props
    this.setState({ selectedPeriod: index })
    getNetworkStatistic(network.id, hoursList[index], this.props.navigate)
  }

  handleEventIndexChange = (event) => {
    const { getNetworkStatistic, network } = this.props
    const index = event.nativeEvent.selectedSegmentIndex
    this.setState({ selectedPeriod: index })
    getNetworkStatistic(network.id, hoursList[index], this.props.navigate)
  }

  getChartInfo = () => {
    const { allData } = this.state
    const gridMax = Math.max(...allData) || 100

    return {
      gridMin: 0,
      gridMax: gridMax + gridMax * 0.1,
    }
  }

  formatLabel = (value, index) => {
    if (index % 4 === 0) {
      const { data, selectedPeriod } = this.state
      const date = moment.utc(data[value].created_at).local()

      return [0, 1].includes(selectedPeriod) ? date.format('h:mm A') : date.format('MM-DD')
    }
    return ''
  }

  formatSpeedLabel = (value) => {
    switch (value >= 1000) {
      case true:
        return `${(value / 1000).toPrecision(2)} Gb`
      default:
        return `${value} Mb`
    }
  }

  renderXAxis = () => {
    const { data } = this.state
    return (
      <XAxis
        style={styles.XAxis}
        svg={axesSvg}
        data={data}
        xMax={data.length}
        xMin={0}
        formatLabel={this.formatLabel}
      />
    )
  }

  logOutZoomState = (e, gestureState, { zoomLevel }) => {
    this.setState(() => ({
      chartZoomLevel: zoomLevel,
    }))
  }

  renderNetworkOverviewChart = () => {
    const { allData, overviewCapacity, overviewThroughput } = this.state
    const chartData = [
      {
        data: overviewCapacity,
        svg: downloadStyle,
      },
      {
        data: overviewThroughput,
        svg: uploadStyle,
      },
    ]
    // const { gridMax } = this.getChartInfo()
    const gridMax = Math.max(...[...overviewCapacity, ...overviewThroughput])
    const hasCapacity = overviewCapacity.some((item) => item > 0)
    const hasThroughput = overviewThroughput.some((item) => item > 0)
    if ((!hasThroughput && !hasCapacity) || gridMax === 0)
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <View style={[styles.noDataWrapper, { width: deviceWidth }]}>
              <View style={styles.chartTitle}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>Network Overview</Text>
              </View>
              <Text style={{ ...styles.noDataText, color: theme.primaryText }}>No data available</Text>
            </View>
          )}
        </ManageThemeContext.Consumer>
      )
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ width: deviceWidth }}>
            <ReactNativeZoomableView
              maxZoom={1.3}
              minZoom={0.5}
              zoomStep={0.1}
              initialZoom={1}
              captureEvent
              onDoubleTapAfter={this.logOutZoomState}
              onZoomAfter={this.logOutZoomState}>
              <View style={[styles.chart]}>
                <YAxis
                  style={styles.YAxis}
                  formatLabel={this.formatSpeedLabel}
                  svg={axesSvg}
                  max={gridMax * 2}
                  min={0}
                  data={allData}
                  contentInset={contentInsetVertical}
                />
                <View style={styles.chartGridWrap}>
                  {this.renderHistory()}
                  {hasCapacity && (
                    <LineChart
                      data={chartData}
                      style={styles.flex}
                      yMax={gridMax * 2}
                      yMin={0}
                      xMax={overviewCapacity.length}
                      xMin={0}
                      svg={uploadStyle}>
                      <CustomGrid ticks={20} />
                    </LineChart>
                  )}
                  {this.renderXAxis()}
                </View>
              </View>
            </ReactNativeZoomableView>
            <View style={{ backgroundColor: theme.primaryBackground }}>
              <View style={{ ...styles.chartLegend, backgroundColor: theme.primaryBackground }}>
                <Text style={styles.download}>–– Capacity</Text>
                <Text style={styles.upload}>–– Throughput</Text>
              </View>
              <View style={{ ...styles.chartTitle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>Network Overview</Text>
              </View>
            </View>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderGatewayCapacityChart = () => {
    const { data, allData } = this.state
    const { gridMax } = this.getChartInfo()
    const hasStatsUp = data.map((item) => item.upload) // .some > 0
    const hasStatsDown = data.map((item) => item.download) // .some > 0
    const capacityUpload = data.map((item) => (item.upload !== 0 ? item.upload : 0)) // 0 replaced undefined
    const capacityDownload = data.map((item) => (item.download !== 0 ? item.download : 0)) // 0 replaced undefined
    const chartData = [
      {
        data: capacityUpload,
        svg: uploadStyle,
      },
      {
        data: capacityDownload,
        svg: downloadStyle,
      },
    ]
    if ((!hasStatsUp && !hasStatsDown) || gridMax === 0)
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <View style={[styles.noDataWrapper, { width: deviceWidth }]}>
              <View style={styles.chartTitle}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>Gateways Capacity</Text>
              </View>
              <Text style={{ ...styles.noDataText, color: theme.primaryText }}>No data available</Text>
            </View>
          )}
        </ManageThemeContext.Consumer>
      )
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ width: deviceWidth }}>
            <ReactNativeZoomableView
              maxZoom={1.3}
              minZoom={0.5}
              zoomStep={0.1}
              initialZoom={1}
              captureEvent
              onDoubleTapAfter={this.logOutZoomState}
              onZoomAfter={this.logOutZoomState}>
              <View style={[styles.chart]}>
                <YAxis
                  style={styles.YAxis}
                  formatLabel={this.formatSpeedLabel}
                  svg={axesSvg}
                  max={gridMax}
                  min={0}
                  data={allData}
                  numberOfTicks={10}
                  contentInset={contentInsetVertical}
                />
                <View style={styles.chartGridWrap}>
                  {this.renderHistory()}
                  {hasStatsUp && (
                    <LineChart
                      contentInset={contentInset}
                      style={styles.flex}
                      data={chartData}
                      yMax={gridMax}
                      yMin={0}
                      xMax={data.length}
                      svg={uploadStyle}>
                      <CustomGrid belowChart />
                    </LineChart>
                  )}
                  {this.renderXAxis()}
                </View>
              </View>
            </ReactNativeZoomableView>
            <View style={styles.chartLegend}>
              <Text style={styles.download}>–– Download</Text>
              <Text style={styles.upload}>–– Upload</Text>
            </View>
            <View style={styles.chartTitle}>
              <Text style={{ ...styles.chartName, color: theme.primaryText }}>Gateways Capacity</Text>
            </View>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderGatewayUtilizationChart = () => {
    const { allData, overviewUtilizationData } = this.state
    if (!overviewUtilizationData || !overviewUtilizationData.length)
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <View style={[styles.noDataWrapper, { width: deviceWidth }]}>
              <View style={styles.chartTitle}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>Gateways Utilization</Text>
              </View>
              <Text style={{ ...styles.noDataText, color: theme.primaryText }}>No data available</Text>
            </View>
          )}
        </ManageThemeContext.Consumer>
      )

    const chartData = [
      {
        data: overviewUtilizationData.map((item) => item.utilizationUp),
        svg: uploadStyle,
      },
      {
        data: overviewUtilizationData.map((item) => item.utilizationDown),
        svg: downloadStyle,
      },
    ]

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ width: deviceWidth }}>
            <ReactNativeZoomableView
              maxZoom={1.3}
              minZoom={0.5}
              zoomStep={0.1}
              initialZoom={1}
              captureEvent
              onDoubleTapAfter={this.logOutZoomState}
              onZoomAfter={this.logOutZoomState}>
              <View style={[styles.chart]}>
                <YAxis
                  style={styles.YAxis}
                  formatLabel={(value) => `${value}%`}
                  svg={axesSvg}
                  max={100}
                  min={0}
                  data={allData}
                  numberOfTicks={10}
                  contentInset={contentInsetVertical}
                />
                <View style={styles.chartGridWrap}>
                  {this.renderHistory()}
                  <LineChart
                    contentInset={contentInset}
                    style={styles.flex}
                    data={chartData}
                    yMax={100}
                    yMin={0}
                    xMax={overviewUtilizationData.length}
                    xMin={0}
                    svg={uploadStyle}>
                    <CustomGrid belowChart />
                  </LineChart>
                  {this.renderXAxis()}
                </View>
              </View>
            </ReactNativeZoomableView>
            <View style={styles.chartLegend}>
              <Text style={styles.download}>–– Download</Text>
              <Text style={styles.upload}>–– Upload</Text>
            </View>
            <View style={styles.chartTitle}>
              <Text style={{ ...styles.chartName, color: theme.primaryText }}>Gateways Utilization</Text>
            </View>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  renderGatewaysCharts = (gatewayId) => {
    const gateway = this.props.networkStatistic.chart.find((x) => x?.id === gatewayId)
    const chartTitle = gateway?.name
    const hasStats = gateway?.stats.some((item) => item?.id === gateway?.id)
    if (!this.props.nodeId && (!gateway?.id || !hasStats)) return null

    const chart = gateway
      ? gateway.stats.map((elem) => ({
          capacity: +elem.download + +elem.upload,
          throughput: +elem.download_throughput + +elem.upload_throughput,
          created_at: elem.created_at,
        }))
      : []

    const chartValues = [
      ...Array.from([...chart.map((item) => item.capacity), ...chart.map((item) => item.throughput)]),
    ]

    const isEmptyStats = chartValues.every((el) => el === 0)

    if (isEmptyStats)
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <View style={[styles.noDataWrapper, { width: deviceWidth }]}>
              <View style={styles.chartTitle}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>Node Overview</Text>
              </View>
              <Text style={{ ...styles.noDataText, color: theme.primaryText }}>No data available</Text>
            </View>
          )}
        </ManageThemeContext.Consumer>
      )

    const chartCapacity = chart.map((item) => item.capacity)
    const chartThroughput = chart.map((item) => item.throughput)
    const chartMax = Math.max(...chartValues)
    const dataMax = chartMax + chartMax * 0.1
    const chartData = [
      {
        data: chartCapacity,
        svg: uploadStyle,
      },
      {
        data: chartThroughput,
        svg: downloadStyle,
      },
    ]

    return dataMax ? (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View style={{ width: deviceWidth }}>
            <ReactNativeZoomableView
              maxZoom={1.3}
              minZoom={0.5}
              zoomStep={0.1}
              initialZoom={1}
              captureEvent
              onDoubleTapAfter={this.logOutZoomState}
              onZoomAfter={this.logOutZoomState}>
              <View style={[styles.chart]}>
                <YAxis
                  style={styles.YAxis}
                  formatLabel={this.formatSpeedLabel}
                  svg={axesSvg}
                  max={dataMax}
                  min={0}
                  data={chartValues}
                  numberOfTicks={10}
                  contentInset={contentInsetVertical}
                />
                <View style={{ ...styles.chartGridWrap }}>
                  {this.renderHistory()}
                  <LineChart
                    contentInset={contentInset}
                    style={styles.flex}
                    data={chartData}
                    yMax={dataMax}
                    yMin={0}
                    xMax={chartCapacity.length}
                    xMin={0}
                    svg={uploadStyle}>
                    <CustomGrid belowChart />
                  </LineChart>
                  {this.renderXAxis()}
                </View>
              </View>
            </ReactNativeZoomableView>
            <View style={styles.chartLegend}>
              <Text style={styles.upload}>–– Capacity</Text>
              <Text style={styles.download}>–– Throughput</Text>
            </View>
            {!this.props.nodeId ? (
              <View style={styles.chartTitle}>
                <Text style={{ ...styles.chartName, color: theme.primaryText }}>{chartTitle}</Text>
              </View>
            ) : (
              <View style={styles.buttonWrap} />
            )}
          </View>
        )}
      </ManageThemeContext.Consumer>
    ) : null
  }

  renderHistory = () => {
    const { data, selectedPeriod } = this.state
    if (selectedPeriod === 2) return null

    return <HistoryChart data={data} selectedPeriod={selectedPeriod} />
  }

  renderPicker = () => {
    const { selectedPeriod } = this.state
    // return (
    //   <View style={{ paddingHorizontal: 20 }}>
    //     <SegmentedControl
    //       // values={periodList}
    //       tabs={periodList}
    //       // selectedIndex={selectedPeriod}
    //       currentIndex={selectedPeriod}
    //       onChange={this.handleIndexChange}
    //       // onChange={(event) => {
    //       //   this.setState({ selectedIndex: event.nativeEvent.selectedSegmentIndex })
    //       // }}
    //       // paddingVertical={10}
    //       containerStyle={{ marginVertical: 10 }}
    //       width={Dimensions.get('screen').width - 20}
    //     />
    //   </View>
    // )

    return (
      <ManageThemeContext.Consumer>
        {({ theme, mode }) => (
          <View style={[styles.buttonWrap, styles.segmentedTabs]}>
            {/* <SegmentedControlTab values={periodList} selectedIndex={selectedPeriod} onTabPress={this.handleIndexChange} /> */}
            <SegmentedControl
              tabs={periodList}
              currentIndex={selectedPeriod}
              onChange={this.handleIndexChange}
              theme={mode.toUpperCase()}
              segmentedControlBackgroundColor={theme.primaryBorder} // "#FFFFFF"
              activeSegmentBackgroundColor="#0076FF"
              activeTextColor="white"
            />
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }

  render() {
    const { nodeId, networkStatistic } = this.props
    const { chartZoomLevel, currentPageNum } = this.state
    const isScrollEnabled = chartZoomLevel === 1
    const paginationData = [0, 0, 0, 0, ...new Array(3 + networkStatistic.chart.length).fill(1), 0, 0, 0, 0]

    if (nodeId) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <View
              style={{
                ...styles.container,
                backgroundColor: theme.primaryBackground,
                borderColor: theme.primaryBorder,
              }}>
              {this.renderPicker()}
              <View style={styles.flexRow}>{this.renderGatewaysCharts(nodeId)}</View>
            </View>
          )}
        </ManageThemeContext.Consumer>
      )
    }
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <View
            style={{ ...styles.container, backgroundColor: theme.primaryBackground, borderColor: theme.primaryBorder }}>
            {this.renderPicker()}
            <ScrollView onMomentumScrollEnd={this.onScrollEnd} horizontal pagingEnabled scrollEnabled={isScrollEnabled}>
              <Pressable>
                <View style={styles.flexRow}>
                  {this.renderNetworkOverviewChart()}
                  {this.renderGatewayCapacityChart()}
                  {this.renderGatewayUtilizationChart()}
                  {networkStatistic && networkStatistic.chart.length ? (
                    networkStatistic.chart.map((item) => (
                      <View key={item.id}>{this.renderGatewaysCharts(item.id)}</View>
                    ))
                  ) : (
                    <Text>Chart</Text>
                  )}
                </View>
              </Pressable>
            </ScrollView>
            <View style={styles.chartPaginationWrapper}>
              <FlatList
                ref={this._flatlistRef}
                data={paginationData}
                renderItem={({ item, index }) => (
                  <RenderPaginationItem
                    color={item ? theme.primaryBlue : 'transparent'}
                    index={index}
                    currentPageNum={currentPageNum}
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={3}
                scrollEnabled={false}
                onScrollToIndexFailed={info => {
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    console.log('[Chart.js] - onScrollToIndexFailed')
                    this._flatlistRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
              />
            </View>
          </View>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  segmentedTabs: {
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  buttonWrap: {
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  noDataWrapper: {
    height: 225,
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 22,
    fontWeight: '300',
    alignSelf: 'center',
    textAlign: 'center',
  },
  chartTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  chartName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#101114',
  },
  chart: {
    height: 200,
    width: gatewaySliderWidth + 30 * 2,
    marginLeft: 10,
    flexDirection: 'row',
  },
  chartGridWrap: {
    flex: 1,
    marginLeft: 6,
    marginRight: 10,
  },
  XAxis: {
    height: 10,
    marginTop: 10,
  },
  YAxis: {},
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    alignContent: 'center',
    paddingTop: 8,
    paddingBottom: 0,
  },
  download: {
    color: '#00B860',
  },
  upload: {
    color: '#1F6BFF',
  },
  flex: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  chartPaginationWrapper: { width: 6 * 5 + 4 * 5, alignSelf: 'center', paddingBottom: 20 },
})

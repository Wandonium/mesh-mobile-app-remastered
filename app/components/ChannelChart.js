import React from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import { BarChart, Grid, YAxis, XAxis } from 'react-native-svg-charts'
import { Rect } from 'react-native-svg'
import * as scale from '../../node_modules/d3-scale'

const axesSvg = { fontSize: 10, fill: 'grey' }
const verticalContentInset = { top: 10, bottom: 10 }
const xAxisHeight = 10
const fill = '#006fc0'

const TEXT_LENGTH = 190
const TEXT_HEIGHT = 16
const OFFSET = TEXT_LENGTH / 2 - TEXT_HEIGHT / 2

const scroll = React.createRef()
const chartContainerRef = React.createRef()
const channels2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export default ({ xLabels, currChannel, data, bestData, Label, biggestY, biggest, offset, ...props }) => {
  const stroke = currChannel === bestData.overlapChannel ? '#00B860' : '#007bc8'
  const chartWidth = offset * data.length

  const { bestIndex: index = 0 } = bestData
  const { length = 0 } = bestData.channels

  let areaX = false
  let areaWidth = offset * length

  if (bestData && bestData.channels.includes(bestData.overlapChannel)) {
    if (data[index].bandwidth === 20 && channels2.includes(bestData.overlapChannel)) {
      // half overlap for 2.4 20
      areaX = index * offset - offset * 1.5
      areaWidth = 4 * offset
    } else {
      areaX = index * offset
    }
  } else {
    areaX = index * offset
    areaWidth = offset * length
  }

  const Decorator = ({ y, height }) => {
    return (
      <Rect
        width={areaWidth}
        height={height - 20}
        x={areaX}
        y={y(biggestY)}
        stroke={stroke}
        fill="rgba(0,123,200,0.05)"
      />
    )
  }

  const scrollToRecomended = () => scroll.current && scroll.current.scrollTo({ x: areaX - areaWidth, animated: true })

  return (
    <View style={styles.chartContainer} ref={chartContainerRef}>
      <View style={styles.leftLegendWrap}>
        <Text style={styles.leftLegendText}>Aggregate Noise (dBm)</Text>
      </View>
      <YAxis
        style={styles.yAxis}
        contentInset={verticalContentInset}
        svg={axesSvg}
        max={biggestY - 100}
        min={-100}
        data={[0, -100]}
      />
      <ScrollView style={{ paddingBottom: 10 }} ref={scroll} horizontal>
        <View style={[styles.grid, { width: chartWidth }]} onLayout={scrollToRecomended}>
          <BarChart
            style={styles.flex}
            svg={{ fill }}
            contentInset={verticalContentInset}
            yAccessor={({ item }) => item.value}
            xScale={scale.scaleBand}
            data={data}
            yMax={biggestY || 100}
            yMin={0}
            spacingOuter={0}>
            <Decorator />
            <Grid direction={Grid.Direction.HORIZONTAL} svg={{ x2: chartWidth }} />
          </BarChart>
          <XAxis
            svg={axesSvg}
            style={styles.xAxis}
            xAccessor={({ item }) => item}
            scale={scale.scaleBand}
            data={xLabels}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
  grid: {
    flex: 1,
    marginLeft: 5,
  },
  xAxis: {
    height: xAxisHeight,
    marginTop: 0,
  },
  yAxis: {
    marginBottom: xAxisHeight + 10,
    marginLeft: 5,
  },
  leftLegendText: {
    transform: [{ rotate: '270deg' }, { translateX: -TEXT_LENGTH }, { translateY: -OFFSET }],
    color: 'grey',
    textAlign: 'center',
    lineHeight: TEXT_HEIGHT,
    width: TEXT_LENGTH,
    height: TEXT_HEIGHT,
  },
  leftLegendWrap: {
    height: TEXT_LENGTH,
    width: TEXT_HEIGHT,
  },
})

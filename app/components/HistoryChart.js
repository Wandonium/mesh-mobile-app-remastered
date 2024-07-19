import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { StyleSheet } from 'react-native'
import { BarChart } from 'react-native-svg-charts'

const periods = [25, 25, 30]
const selectNetworkId = createSelector(
  state => state.networks.historyNetworkId,
  historyNetworkId => historyNetworkId,
)

const selectAllHistory = createSelector(
  state => state.networks.networkHistory,
  history => history || [],
)

const contentInsetSecond = { left: 0, right: 0, top: 10, bottom: 20 }

const colors = status => {
  if (status === 'Partial Offline') return { fill: 'rgb(255,191,0)', fillOpacity: 0.3 }
  if (status === 'Offline') return { fill: 'rgb(235, 78, 77)', fillOpacity: 0.3 }
  return { fill: 'none' }
}

const getNewHistory = (data, selectedPeriod) => {
  const bars = []

  if (data.length) {
    data.forEach(item => {
      bars.push({ value: 110, date: item.created_at, svg: colors(item.status) })
    })
  }
  if (data.length < periods[selectedPeriod]) {
    const length = periods[selectedPeriod] - data.length
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < length; i++) {
      bars.unshift({ value: 110, date: data[0].created_at, svg: { fill: 'none' } })
    }
  } else if (data.length > periods[selectedPeriod]) {
    return bars.slice(-periods[selectedPeriod])
  }
  return bars
}

export default React.memo(({ selectedPeriod, networkId }) => {
  const historyNetworkId = useSelector(selectNetworkId)
  const history = useSelector(selectAllHistory)
  if (!historyNetworkId || historyNetworkId !== networkId) return null
  if (!history || !history.length) return null

  const bars = getNewHistory(history, selectedPeriod)

  return (
    <>
      {bars.length && (
        <BarChart
          contentInset={contentInsetSecond}
          style={StyleSheet.absoluteFill}
          data={bars}
          yAccessor={({ item }) => item.value}
          yMax={100}
          yMin={0}
          xMax={periods[selectedPeriod]}
          xMin={0}
          spacingOuter={0}
          spacingInner={0}
        />
      )}
    </>
  )
})

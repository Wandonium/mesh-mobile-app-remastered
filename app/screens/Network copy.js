import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import BottomSheet from '@gorhom/bottom-sheet'
import { Map, HeaderGradient, NetworkDetails, NodeDetails, BottomDrawer, Chart } from '../components'
import { markerColor, getStatusBarHeight } from '../services'
import { useTheme } from '../theme/ThemeManager'

const headerHeight = 120
const graphHeight = 280
const bottomHeaderHeight = 88
const bottomNodeContentHeight = graphHeight
const initialMapOffset = headerHeight - getStatusBarHeight()

const bottomDrawer = React.createRef()

const Network = (props) => {
  const {
    network,
    network: current,
    navigation,
    route,
    deleteNetwork,
    editNetwork,
    networkHistory,
    getNetworkHistory,
    networkStatistic,
    getNetworkStatistic,
    getNetworkWithNodes,
    unsubscribeFromNetwork,
    isAdmin,
    isManager,
    canShare,
    nodes,
    selectedPeriod,
    setRequestTimeRangeInterval,
  } = props
  // eslint-disable-next-line no-underscore-dangle
  const _bottomDrawerHeight = Dimensions.get('window').height - headerHeight
  const [mapOffset, setMapOffset] = useState(initialMapOffset)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNode, setSelectedNode] = useState(route.params?.selectedNode)
  const [bottomDrawerHeight, setBottomDrawerHeight] = useState(
    route.params?.selectedNode ? bottomNodeContentHeight : _bottomDrawerHeight,
  )

  const { theme } = useTheme()

  useEffect(() => {
    if (current) {
      getNetworkStatistic(current.id)
    }
  }, [current, getNetworkStatistic])

  useEffect(() => {
    if (current) {
      const { total_ap, id } = current
      if (nodes && nodes.length !== total_ap) {
        getNetworkWithNodes(id)
      }
    }
  }, [nodes, current, getNetworkWithNodes])

  useEffect(() => {
    if (!current) {
      navigation.goBack(null)
      setBottomDrawerHeight(_bottomDrawerHeight)
    }
    if (selectedNode) {
      setSelectedNode(nodes.find((node) => node?.id === selectedNode?.id))
      setBottomDrawerHeight(_bottomDrawerHeight)
    } else {
      // setSelectedNode(null)
      setBottomDrawerHeight(_bottomDrawerHeight)
    }
  }, [_bottomDrawerHeight, current, navigation, nodes, selectedNode])

  useEffect(() => {
    setBottomDrawerHeight(654)
  }, [selectedNode])

  const goBack = () => {
    if (selectedNode) {
      setActiveTabIndex(1)
      setSelectedNode(null)
      setBottomDrawerHeight(_bottomDrawerHeight)
    } else {
      navigation.goBack(null)
    }
  }

  const toggleDrawerState = () => {
    bottomDrawer.current.toggleDrawerState()
  }

  const pressOnMarker = (selectedNodeId) => {
    if (nodes.length) {
      const node = nodes.find(({ id }) => selectedNodeId === id)
      setSelectedNode(node)
      setBottomDrawerHeight(bottomNodeContentHeight)
      setMapOffset(bottomNodeContentHeight - initialMapOffset - (!isAdmin && selectedNodeId ? bottomHeaderHeight : 0))
    }
  }

  const onCollapsed = () => setMapOffset(initialMapOffset)

  const actionWithNode = (node, action) => {
    if (action === 'edit') {
      navigation.navigate('NodeManual', { node, network })
    } else {
      props[`${action}Node`](navigation, network, node, current.id, node.id)
      goBack()
    }
  }

  const item = selectedNode || network
  const full_address = item && item?.full_address.length > 3 ? item.full_address : 'Address, City, Index'
  const withChart =
    networkStatistic && networkStatistic.chart && networkStatistic.chart.some((x) => x?.id === item?.id) ? 300 : 0
  const currentNode = nodes ? nodes.find((node) => node?.id === selectedNode) : null
  const markers = nodes?.length ? nodes : [network]

  return (
    network && (
      <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
        <Map
          navigation={navigation}
          offset={mapOffset}
          selectedMarkerId={selectedNode && selectedNode?.id}
          pressOnMarker={pressOnMarker}
          hideMarkers={!nodes.length}
          markers={markers}
        />

        <HeaderGradient onPress={goBack} text={selectedNode ? `Back to ${network.name}` : null} />
        <BottomDrawer
          offset={30}
          key={selectedNode ? selectedNode?.id : 0}
          ref={bottomDrawer}
          startUp
          containerHeight={bottomDrawerHeight - (!isAdmin && selectedNode ? bottomHeaderHeight : 0) + withChart}
          downDisplay={bottomDrawerHeight - 70 - (!isAdmin && selectedNode ? bottomHeaderHeight : 0) + withChart}
          onCollapsed={onCollapsed}>
          <View style={{ ...styles.bottomDrawer, backgroundColor: theme.primaryBackground }}>
            <View
              style={[
                styles.statusLine,
                { backgroundColor: markerColor(selectedNode ? selectedNode.status : network.status) },
              ]}
            />
            <View style={styles.line} />
            <View style={styles.networkInfo}>
              <TouchableOpacity onPress={toggleDrawerState}>
                <Text numberOfLines={1} style={{ ...styles.networkName, color: theme.primaryText }}>
                  {selectedNode ? selectedNode.name : network.name}
                </Text>
              </TouchableOpacity>
              <Text numberOfLines={1} style={styles.networkAddress}>
                {full_address}
              </Text>
            </View>

            {selectedNode ? (
              <NodeDetails
                isAdmin={isAdmin}
                isManager={isManager}
                actionWithNode={actionWithNode}
                node={selectedNode}
                network={network}
                selectedPeriod={selectedPeriod}
                networkHistory={networkHistory}
                getNetworkHistory={getNetworkHistory}
                networkStatistic={networkStatistic}
                getNetworkStatistic={getNetworkStatistic}
                setRequestTimeRangeInterval={setRequestTimeRangeInterval}
                navigation={navigation}
              />
            ) : (
              <NetworkDetails
                isAdmin={isAdmin}
                isManager={isManager}
                canShare={canShare}
                navigation={navigation}
                route={route}
                activeTabIndex={activeTabIndex}
                deleteNetwork={deleteNetwork}
                editNetwork={editNetwork}
                pressOnNode={pressOnMarker}
                network={network}
                selectedPeriod={selectedPeriod}
                networkHistory={networkHistory}
                getNetworkHistory={getNetworkHistory}
                networkStatistic={networkStatistic}
                unsubscribeFromNetwork={unsubscribeFromNetwork}
                getNetworkStatistic={getNetworkStatistic}
                setRequestTimeRangeInterval={setRequestTimeRangeInterval}
              />
            )}
          </View>
        </BottomDrawer>
      </View>
    )
  )
}

Network.navigationOptions = {
  gestureEnabled: false,
}

export default Network

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomDrawer: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  line: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 9,
    alignSelf: 'center',
    backgroundColor: 'rgba(203,205,204,0.5)',
  },
  statusLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  networkInfo: {
    marginTop: 18,
    marginHorizontal: 16,
  },
  networkName: {
    color: '#101114',
    fontSize: 24,
    lineHeight: 32,
  },
  networkAddress: {
    marginTop: 2,
    color: '#8F97A3',
    fontSize: 12,
    lineHeight: 18,
  },
})

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import BottomSheet, { TouchableOpacity } from '@gorhom/bottom-sheet'
import { Map, HeaderGradient, NetworkDetails, NodeDetails } from '../components'
import { Reboot } from '../components/svg'
import { markerColor, getStatusBarHeight } from '../services'
import { useTheme } from '../theme/ThemeManager'
import { CommonActions } from '@react-navigation/native'

const headerHeight = 120
const graphHeight = 280
const bottomHeaderHeight = 88
const bottomNodeContentHeight = graphHeight
const initialMapOffset = headerHeight - getStatusBarHeight()

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
    refreshOneNetwork,
  } = props

  const { theme } = useTheme()
  const window = useWindowDimensions()
  const maxSheetHeight = window.height - headerHeight

  const [mapOffset, setMapOffset] = useState(initialMapOffset)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNode, setSelectedNode] = useState(route.params?.selectedNode)
  const [bottomDrawerHeight, setBottomDrawerHeight] = useState(
    route.params?.selectedNode ? bottomNodeContentHeight : maxSheetHeight,
  )
  const nodeDrawerHeight = useMemo(() => 670 - (!isAdmin && selectedNode ? bottomHeaderHeight : 0), [
    selectedNode,
    isAdmin,
  ])
  const snapPoints = useMemo(
    () =>
      selectedNode
        ? [80, Math.min(maxSheetHeight, 280), Math.min(nodeDrawerHeight, maxSheetHeight)]
        : [80, Math.min(maxSheetHeight, 280), Math.min(bottomDrawerHeight, maxSheetHeight)],
    [selectedNode, maxSheetHeight, nodeDrawerHeight, bottomDrawerHeight],
  )

  const [sheetSnapPoint, setSheetSnapPoint] = useState(2)

  const item = selectedNode || network
  const full_address = item && item?.full_address.length > 3 ? item.full_address : 'Address, City, Index'
  const withChart =
    networkStatistic && networkStatistic.chart && networkStatistic.chart.some((x) => x?.id === item?.id) ? 300 : 0
  const currentNode = nodes ? nodes.find((node) => node?.id === selectedNode) : null
  const markers = nodes?.length ? nodes : [network]

  const bottomSheetRef = useRef(null)

  const maxScrollHeight = selectedNode && sheetSnapPoint === 1 ? Math.min(maxSheetHeight - 100, 210) : undefined

  const handleSheetChanges = useCallback((index) => {
    setSheetSnapPoint(index)
    if (index === 0) {
      setMapOffset(100)
    }
    if (index === 1) {
      setMapOffset(300)
    }
  }, [])
  const handleSnapPress = useCallback((index) => {
    bottomSheetRef.current?.snapToIndex(index)
  }, [])

  // useEffect(() => {
  //   if (current) {
  //     getNetworkStatistic(current.id)
  //   }
  // }, [current, getNetworkStatistic])

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
    }
    if (selectedNode) {
      setSelectedNode(nodes.find((node) => node?.id === selectedNode?.id))
      handleSnapPress(2)
    } else {
      handleSnapPress(2)
      // setSelectedNode(null)
    }
  }, [current, navigation, nodes, selectedNode, handleSnapPress])

  // useEffect(() => {
  //   setBottomDrawerHeight(654)
  // }, [selectedNode])

  const goBack = () => {
    if (selectedNode) {
      console.log('[Network.js] - selectedNode')
      setActiveTabIndex(1)
      setSelectedNode(null)
      // setBottomDrawerHeight(maxSheetHeight)
    }
    else if(route.params?.fromCreateNetworkDone === true) {
      console.log('[Network.js] - fromCreateNetworkDone', navigation)
      navigation.setParams({ fromCreateNetworkDone: false })
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [{ name: 'CreateNetworkDone', 
                   params: { networkId: network.id },
                }],
      });
      navigation.dispatch(resetAction)
    } else {
      console.log('[Network.js] - goBack')
      navigation.goBack(null)
    }
  }

  const toggleDrawerState = () => {
    // bottomDrawer.current?.toggleDrawerState()
    handleSnapPress(sheetSnapPoint === 2 ? 0 : 2)
  }

  const pressOnMarker = (selectedNodeId) => {
    if (nodes.length) {
      const node = nodes.find(({ id }) => selectedNodeId === id)
      setSelectedNode(node)
      handleSnapPress(1)
      // setMapOffset(bottomNodeContentHeight - initialMapOffset - (!isAdmin && selectedNodeId ? bottomHeaderHeight : 0))
    }
  }

  const actionWithNode = (node, action) => {
    if (action === 'edit') {
      console.log('[Network.js] - action is edit node')
      navigation.navigate('NodeManual', { node, network, fromBLE: false })
    } else {
      console.log("[Network.js] - actionWithNode", action)
      props[`${action}Node`](navigation, network, node, current.id, node.id)
    }
  }

  const refreshTargetNetwork = () => {
    console.log('[Network.js] - networkId', route.params.networkId)
    refreshOneNetwork(route.params.networkId)
  }
  

  const backgroundComponent = ({ style }) => <View style={[style, { backgroundColor: theme.primaryBackground }]} />
  const handleComponent = () => (
    <View style={{ ...styles.bottomDrawer, backgroundColor: theme.primaryBackground }}>
      <View
        style={[
          styles.statusLine,
          { backgroundColor: markerColor(selectedNode ? selectedNode.status : network.status) },
        ]}
      />
      <View style={styles.line} />
    </View>
  )

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
        <BottomSheet
          key={selectedNode ? selectedNode?.id : 0}
          ref={bottomSheetRef}
          index={sheetSnapPoint}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleComponent={handleComponent}
          backgroundComponent={backgroundComponent}
          // offset={30}
          // containerHeight={bottomDrawerHeight - (!isAdmin && selectedNode ? bottomHeaderHeight : 0) + withChart}
          // downDisplay={bottomDrawerHeight - 70 - (!isAdmin && selectedNode ? bottomHeaderHeight : 0) + withChart}
        >
          <View style={{ backgroundColor: theme.primaryBackground }}>
            {/* <View
              style={[
                styles.statusLine,
                { backgroundColor: markerColor(selectedNode ? selectedNode.status : network.status) },
              ]}
            />
            <View style={styles.line} /> */}
            <View style={styles.networkSection}>
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
              <TouchableOpacity style={styles.icon} onPress={refreshTargetNetwork}>
                <Reboot size={50} fill="#1F6BFF" />
              </TouchableOpacity>
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
                maxScrollHeight={maxScrollHeight}
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
        </BottomSheet>
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
    // justifyContent: 'center',
    // alignItems: 'center',
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
  networkSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkInfo: {
    marginTop: 18,
    marginHorizontal: 16,
    width: '60%'
  },
  icon: {
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderRadius: 18,
    aspectRatio: 1,
    height: 50,
    width: 50,
    marginTop: 18,
    marginRight: 30,
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
  dropShadow: {
    shadowColor: 'gray',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 3 },
    shadowRadius: 5,
  },
})

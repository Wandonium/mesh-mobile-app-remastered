import React, { PureComponent } from 'react'
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps'
import { Address } from './svg'
import mapStyle from '../constants/mapStyle'
import { markerColor } from '../services'

//import Geolocation from '@react-native-community/geolocation'
//import Geolocation from 'react-native-geolocation-service'

import Geolocation from '../services/GeoDep'

const TILE_SIZE = 256

export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  // maximumAge: 120000,
  distanceFilter: 0,
  accuracy: {
    android: 'high',
    ios: 'best',
  },
  // forceRequestLocation: true,
  // showLocationDialog: true,
}

const mapPdddingOptions = {
  edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
  animated: false,
}

const { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const MARKER_RADIUS_PX = 20
const MAX_WEIGHT = 15
// const MIN_LINE_WEIGHT_PX = 2
const WEIGHT_ACCRETION = 7

const getLineLengthPx = (start, end) => {
  const xLength = start.x - end.x
  const yLength = start.y - end.y

  return Math.sqrt(xLength * xLength + yLength * yLength)
}

const getWeight = (items, fallback = 0) =>
  items > 0 ? 3 + (MAX_WEIGHT * Math.log(items / WEIGHT_ACCRETION + 1)) / Math.exp(1) : fallback

const getTxWeight = (tx) => {
  const reg = tx.match('([0-9]+\\.[0-9]+)')
  return reg[0] !== '' ? reg[0] : 4
}

const getLineWeight = (clients) => getWeight(clients)

// const getLineStatus = (start, end) => start.status.toLowerCase() === 'active' && end.status.toLowerCase() === 'active'

// const getCircleWeight = clients => {
//   return getWeight(clients, MIN_LINE_WEIGHT_PX)
// }

const getZoom = (longitudeDelta = LONGITUDE_DELTA) => Math.log2((360 * width) / (longitudeDelta * 256))

function MercatorProjection() {
  this.pixelOrigin_ = { x: TILE_SIZE / 2, y: TILE_SIZE / 2 }
  this.pixelsPerLonDegree_ = TILE_SIZE / 360
  this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI)
}

const bound = (value, opt_min, opt_max) => {
  if (opt_min !== null) return Math.max(value, opt_min)
  if (opt_max !== null) return Math.min(value, opt_max)
  return value
}

const degreesToRadians = (deg) => deg * (Math.PI / 180)
const radiansToDegrees = (rad) => rad / (Math.PI / 180)

MercatorProjection.prototype.fromLatLngToPoint = function (latLng, opt_point) {
  const me = this
  const point = opt_point || { x: 0, y: 0 }
  const origin = me.pixelOrigin_

  point.x = origin.x + latLng.longitude * me.pixelsPerLonDegree_
  const siny = bound(Math.sin(degreesToRadians(latLng.latitude)), -0.9999, 0.9999)

  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_

  return point
}

MercatorProjection.prototype.ground_resolution = (latitude, zoomLevel) =>
  (Math.cos((latitude * Math.PI) / 180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, zoomLevel))

MercatorProjection.prototype.fromPointToLatLng = function (point) {
  const me = this
  const origin = me.pixelOrigin_
  const lng = (point.x - origin.x) / me.pixelsPerLonDegree_
  const latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_
  const lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2)
  return { latitude: lat, longitude: lng }
}

const getCroppedLine = (start, end, cropStartLengthPx, cropEndLengthPx, zoom) => {
  const projection = new MercatorProjection()

  const zoomScale = Math.pow(2, zoom)
  const scaledStartPixelsRadius = cropStartLengthPx / zoomScale
  const scaledEndPixelsRadius = cropEndLengthPx / zoomScale

  const startPoint = projection.fromLatLngToPoint(start)
  const endPoint = projection.fromLatLngToPoint(end)

  const lineLengthPixels = getLineLengthPx(startPoint, endPoint)

  if (lineLengthPixels < scaledStartPixelsRadius + scaledEndPixelsRadius) return

  const cropStartCoeff = scaledStartPixelsRadius / lineLengthPixels
  const cropEndCoeff = scaledEndPixelsRadius / lineLengthPixels

  const newStartPx = {
    x: startPoint.x + (endPoint.x - startPoint.x) * cropStartCoeff,
    y: startPoint.y + (endPoint.y - startPoint.y) * cropStartCoeff,
  }

  const newEndPx = {
    x: endPoint.x - (endPoint.x - startPoint.x) * cropEndCoeff,
    y: endPoint.y - (endPoint.y - startPoint.y) * cropEndCoeff,
  }

  return ([newStart, newEnd] = [projection.fromPointToLatLng(newStartPx), projection.fromPointToLatLng(newEndPx)])
}

export default class Map extends PureComponent {
  _map = React.createRef()

  state = {
    croppedLines: [],
    region: null,
    isShowMap: true,
  }

  getMappedMarkers = (markers) =>
    markers
      .filter(({ lat, lng }) => lat && lng)
      .map((mappedMarker) => {
        mappedMarker.weight = getLineWeight(mappedMarker.clients ? mappedMarker.clients : 1)
        return mappedMarker
      })

  getLines = (markers, zoom) => {
    const mapedMarkers = this.getMappedMarkers(markers)

    const coordinates = mapedMarkers
      .filter((i) => i.connected && i.status.toLowerCase() === 'active')
      .map((x) => ({
        latitude: x.lat,
        longitude: x.lng,
        id: x.id,
        connected: x.connected,
        // weight: x.weight ? x.weight : 4,
      }))
    const lines = []
    const pairs = []
    coordinates.forEach((item, i) => {
      if (item.connected.length > 0) {
        item.connected.forEach((connection, j) => {
          const txData = item.connected.find((i) => i.neighbour_id === connection.neighbour_id)
          if (!pairs.find((pair) => pair.includes(connection.neighbour_id) && pair.includes(item.id)) && txData) {
            pairs.push([item.id, connection.neighbour_id])
            const item2 = coordinates.find((x) => x.id === connection.neighbour_id)

            if (item2) {
              const croppedCoordinates = getCroppedLine(item, item2, MARKER_RADIUS_PX, MARKER_RADIUS_PX, zoom)
              const croppedWeight = getLineWeight(getTxWeight(txData.tx_bitrate))

              if (croppedCoordinates && croppedWeight)
                lines.push({
                  coordinates: croppedCoordinates,
                  weight: croppedWeight,
                })
            }
          }
        })
      }
    })

    return lines
  }

  onLayout = () => {
    const coordinates = this.props.markers
      .filter(({ lat, lng }) => lat && lng)
      .map((x) => ({ latitude: x.lat, longitude: x.lng }))

    if (coordinates.length) this._map.current.fitToCoordinates(coordinates, mapPdddingOptions)
    // if (!this.props.currentRegion) this._map.current.fitToElements(false)
    if (!this.props.currentRegion && coordinates.length < 1) this.findCoordinates()
  }

  hasLocationPermissionIOS = async () => {
    const openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings')
      })
    }
    const status = await Geolocation.requestAuthorization('whenInUse')

    if (status === 'granted') {
      return true
    }

    if (status === 'denied') {
      Alert.alert('Location permission denied')
    }

    if (status === 'disabled') {
      Alert.alert('Turn on Location Services to allow Mesh++ to determine your location.', '', [
        { text: 'Go to Settings', onPress: openSetting },
        { text: "Don't Use Location", onPress: () => {} },
      ])
    }

    return false
  }

  hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await this.hasLocationPermissionIOS()
      return hasPermission
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true
    }

    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)

    if (hasPermission) return true

    const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      alert('Location permission denied by user')
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      alert('Location permission revoked by user')
    }

    return false
  }

  componentDidMount() {
    const { navigation } = this.props
    if (navigation) {
      this.focusListener = navigation.addListener('focus', () => {
        this.setState({ isShowMap: true })
      })
      this.blurListener = navigation.addListener('blur', () => {
        this.setState({ isShowMap: false })
      })
    }
  }

  componentWillUnmount() {
    this.focusListener && this.focusListener()
    this.blurListener && this.blurListener()
  }

  componentDidUpdate(prevProps) {
    if (this._map.current) {
      if (this.props.currentRegion !== prevProps.currentRegion) {
        this._map.current.animateToRegion(this.props.currentRegion)
      }
      if ((!this.props.selectedMarkerId && prevProps.selectedMarkerId) || this.props.offset !== prevProps.offset) {
        this.onLayout()
      }
      if (this.props.selectedMarkerId && this.props.selectedMarkerId !== prevProps.selectedMarkerId) {
        const coords = this.props.markers.find((x) => x.id === this.props.selectedMarkerId)
        this._map.current.animateCamera({ center: { latitude: coords.lat, longitude: coords.lng } })
      }
    }
  }

  onRegionChangeComplete = async (region) => {
    const cam = await this._map.current.getCamera()
    this.setState({
      croppedLines: this.getLines(this.props.markers, Math.max(cam.zoom, getZoom(region.longitudeDelta))),
    })
  }

  findCoordinates = async () => {
    //const hasLocationPermission = await this.hasLocationPermission()
    // if (!hasLocationPermission) return

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const { setCurrentRegion } = this.props

        if (this._map.current) {
          this._map.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })
          if (setCurrentRegion) setCurrentRegion({ latitude, longitude })
        }
      },
      (error) => {
        if (Platform.OS === 'ios') {
          Alert.alert(
            'Warning',
            error.message,
            [
              { text: 'Open Settings', onPress: () => Linking.openURL('App-Prefs:') },
              { text: 'OK', onPress: () => {} },
            ],
            { cancelable: false },
          )
        } else alert('Location permission denied by user')
      },
      GEOLOCATION_OPTIONS,
    )
  }

  render() {
    const { marker, markers, offset, onPress, currentRegion, pressOnMarker, selectedMarkerId, hideMarkers } = this.props

    const mapedMarkers = this.getMappedMarkers(markers)

    return (
      this.state.isShowMap && (
        <View style={styles.map}>
          <MapView
            provider={PROVIDER_GOOGLE}
            mapPadding={{ bottom: Platform.OS === 'ios' ? offset : 0 }}
            style={[styles.map, { bottom: Platform.OS === 'android' ? offset : 0 }]}
            customMapStyle={mapStyle}
            ref={this._map}
            maxZoomLevel={17}
            rotateEnabled={false}
            toolbarEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={onPress}
            // onPress={event => {
            //   console.log(event)
            //   console.log(event.nativeEvent)
            // }}
            loadingEnabled
            loadingBackgroundColor="white"
            loadingIndicatorColor="#1F6BFF"
            onRegionChangeComplete={this.onRegionChangeComplete}
            initialRegion={currentRegion}
            onLayout={this.onLayout}>
            {this.state.croppedLines && this.state.croppedLines.length > 0
              ? this.state.croppedLines.map((line, index) => (
                  <Polyline
                    // tappable={true}
                    key={index}
                    coordinates={line.coordinates}
                    strokeColor="rgba(0,184,96,0.5)"
                    strokeWidth={line.weight / 2}
                  />
                ))
              : null}
            {marker && (
              <Marker
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}>
                <View style={[styles.marker, { borderWidth: 8, borderColor: '#00B860' }]} />
              </Marker>
            )}
            {!hideMarkers &&
              mapedMarkers.map((mapedMarker) => (
                <Marker
                  key={mapedMarker.id}
                  identifier={String(mapedMarker.id)}
                  // title={marker.title ? marker.title.substring(0, 13) : marker.name ? marker.name.substring(0, 13) : ''}
                  // description={marker.description ? marker.description.substring(0, 13) : ''}
                  anchor={{ x: 0.5, y: 0.5 }}
                  centerOffset={{ x: 0.5, y: 0.5 }}
                  coordinate={{ latitude: mapedMarker.lat, longitude: mapedMarker.lng }}
                  tracksViewChanges={selectedMarkerId === mapedMarker.id}
                  onPress={() => pressOnMarker && pressOnMarker(mapedMarker.id)}>
                  <View
                    style={[
                      styles.marker,
                      {
                        borderWidth: mapedMarker.weight,
                        borderColor: markerColor(mapedMarker.status, mapedMarker.is_gateway),
                        // borderColor: markerColor(mapedMarker.status, mapedMarker.is_gateway),
                      },
                    ]}
                  />
                </Marker>
              ))}
          </MapView>
          {/* <View style={{ position: 'absolute', left: 60, top: 250, backgroundColor: "#FFF", padding: 10 }}>
            <Text>Tooltip</Text>
          </View> */}
          <TouchableOpacity style={[styles.myLocationButton, { bottom: offset + 16 }]} onPress={this.findCoordinates}>
            <Address size={34} fill="#FFF" />
          </TouchableOpacity>
        </View>
      )
    )
  }
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 56,
    height: 56,
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: '#1F6BFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 7 },
    shadowColor: '#101114',
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
  marker: {
    width: 40,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 4,
    opacity: 0.7,
  },
})

import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

export const TILE_SIZE = 256

export const ASPECT_RATIO = width / height
export const LATITUDE_DELTA = 0.0922
export const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

export const MARKER_RADIUS_PX = 20
export const MAX_WEIGHT = 15
export const MIN_LINE_WEIGHT_PX = 2
export const WEIGHT_ACCRETION = 7
// export const MIN_MARKER_DISTANCE_PX = 0
// export const MIN_MARKER_DISTANCE_PX_ZOOM = 0
// export const FOCUSED_MARKER_ZOOM = 16

export const getLineLengthPx = (start, end) => {
  const xLength = start.x - end.x
  const yLength = start.y - end.y

  return Math.sqrt(xLength * xLength + yLength * yLength)
}

export const getWeight = (items, fallback = 0) => {
  return items > 0 ? 3 + (MAX_WEIGHT * Math.log(items / WEIGHT_ACCRETION + 1)) / Math.exp(1) : fallback
}

export const getTxWeight = tx => {
  const reg = tx.match('([0-9]+\\.[0-9]+)')
  return reg[0] !== '' ? reg[0] : 4
}

export const getCircleWeight = clients => {
  return getWeight(clients, MIN_LINE_WEIGHT_PX)
}

export const getLineWeight = clients => {
  return getWeight(clients)
}

export const getLineStatus = (start, end) =>
  start.status.toLowerCase() === 'active' && end.status.toLowerCase() === 'active'

export const getZoom = (longitudeDelta = LONGITUDE_DELTA) => {
  return Math.log2((360 * width) / (longitudeDelta * 256))
}

export const getMarkersWithCircleWeight = markers =>
  markers
    .filter(({ lat, lng }) => lat && lng)
    .map(item => {
      // item.weight = MARKER_RADIUS_PX - getCircleWeight(item.clients ? item.clients : 1) / 2
      item.weight = getCircleWeight(item.clients ? item.clients : 1)
      return item
    })

/* 
  export const calculateDistance = (pointA, pointB) => {
  const lat1 = pointA.latitude
  const lon1 = pointA.longitude

  const lat2 = pointB.latitude
  const lon2 = pointB.longitude

  const R = 6371e3 // earth radius in meters
  const φ1 = lat1 * (Math.PI / 180)
  const φ2 = lat2 * (Math.PI / 180)
  const Δφ = (lat2 - lat1) * (Math.PI / 180)
  const Δλ = (lon2 - lon1) * (Math.PI / 180)

  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const y = Math.sin(Δλ) * Math.cos(φ2)

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * (Math.sin(Δλ / 2) * Math.sin(Δλ / 2))

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const θ = Math.atan2(y, x)
  const bearing = (θ * 180) / Math.PI

  const distance = R * c
  return { distance, bearing } // in meters
}
*/

function MercatorProjection() {
  this.pixelOrigin_ = { x: TILE_SIZE / 2, y: TILE_SIZE / 2 }
  this.pixelsPerLonDegree_ = TILE_SIZE / 360
  this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI)
}

const bound = (value, opt_min, opt_max) => {
  if (opt_min !== null) value = Math.max(value, opt_min)
  if (opt_max !== null) value = Math.min(value, opt_max)
  return value
}

const degreesToRadians = deg => deg * (Math.PI / 180)
const radiansToDegrees = rad => rad / (Math.PI / 180)

MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
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

MercatorProjection.prototype.fromPointToLatLng = function(point) {
  const me = this
  const origin = me.pixelOrigin_
  const lng = (point.x - origin.x) / me.pixelsPerLonDegree_
  const latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_
  const lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2)
  return { latitude: lat, longitude: lng }
}

export const getLines = (markers, zoom) => {
  const mapedMarkers = markers
    .filter(({ lat, lng }) => lat && lng)
    .map(item => {
      item.weight = getLineWeight(item.clients ? item.clients : 1)
      return item
    })
  const coordinates = mapedMarkers
    .filter(i => i.connected && i.status.toLowerCase() === 'active')
    .map(x => ({
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
        const txData = item.connected.find(i => i.neighbour_id === connection.neighbour_id)
        if (!pairs.find(pair => pair.includes(connection.neighbour_id) && pair.includes(item.id)) && txData) {
          pairs.push([item.id, connection.neighbour_id])
          const item2 = coordinates.find(x => x.id === connection.neighbour_id)

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

export const getCroppedLine = (start, end, cropStartLengthPx, cropEndLengthPx, zoom) => {
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

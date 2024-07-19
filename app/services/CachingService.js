import AsyncStorage from '@react-native-async-storage/async-storage'
import Geocoder from 'react-native-geocoding'

const CACHE_NODE_DATA_KEY = 'meshplusplus-cache-node-data'

/**
 *
 * @param {Object} obj
 * @param {Array} params
 */
const checkParams = (obj, params) => {
  const keys = Object.keys(obj)
  const filtered = params.filter((p) => !keys.includes(p))
  return !!filtered.length
}

class CachingService {
  // call this if you want to save node data to async storage
  // the object should look like this:
  /**
   * {
   *  navigation,
   *  associatedNetwork,
   *  data,
   *  navParam,
   * }
   */

  saveNodeData = async (data) => {
    // add check for object fields
    if (checkParams(data, ['navigation', 'associatedNetwork', 'data', 'navParam'])) {
      console.warn(
        'incorrect payload in saveNodeData',
        'should be object with fields: navigation, associatedNetwork, data, navParam',
      )
      return 'failed'
    }

    const stringified = JSON.stringify(data)
    await AsyncStorage.setItem(CACHE_NODE_DATA_KEY, stringified)
    return 'saved'
  }

  getNodeData = async () => {
    try {
      const stringified = await AsyncStorage.getItem(CACHE_NODE_DATA_KEY)
      if (!stringified) return false

      const cachedNode = JSON.parse(stringified)
      const geocodedPosition = await Geocoder.geocodePosition({ lat: cachedNode.data.lat, lng: cachedNode.data.lng })
      const formated_address = geocodedPosition[0].formattedAddress
      const country_code = geocodedPosition[0].countryCode
      const newNodeData = {
        mac: cachedNode.data.mac,
        name: cachedNode.data.name,
        lat: cachedNode.data.lat,
        lng: cachedNode.data.lng,
        full_address: formated_address,
        country_short_name: country_code,
      }

      return [cachedNode.navigation, cachedNode.associatedNetwork, newNodeData, cachedNode.navParam]
    } catch (error) {
      console.warn('something went wrong with getNodeData', error)
      return false
    }
  }

  clearNodeData = () => {
    AsyncStorage.removeItem(CACHE_NODE_DATA_KEY)
  }

  createNodeFromCache = () => {}

  saveAssosiatedNetworks = async () => {}
}

const cachingService = new CachingService()
export default cachingService

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'
import { add } from 'lodash'
import moment from 'moment'
import { StackActions } from '@react-navigation/native'
import { batch } from 'react-redux'
import api from '../config/api'
import {
  ADD_NODE,
  CHANGE_USER_DATA,
  CLEAR_ALERTS,
  CLEAR_NETWORK_DATA,
  CLEAR_SHARED_USERS,
  CLEAR_USER_DATA,
  DELETE_NETWORK,
  DELETE_NODE,
  DELETE_USER,
  EDIT_NETWORK,
  EDIT_NODE,
  EDIT_TEAM_USER,
  GET_ALERTS,
  GET_CAPTIVE_PORTALS,
  GET_NETWORKS,
  GET_NETWORK_HISTORY,
  GET_NETWORK_STATISTIC,
  GET_SHARED_USERS,
  GET_USER,
  LOADING_REQUEST,
  NETWORK_SHARED,
  NETWORK_UNSHARED,
  SAVE_NETWORK,
  SELECT_TIME_RANGE,
  SET_LOADING_PROGRESS
} from '../constants/actionTypes'
import { GET_ACCESS_POINTS } from '../constants/bleActionTypes'
import { AlertHelper, keychain, websockets } from '../services'
import store, { persistor } from '../store'

import {
  DFU_SUBSCRIBE,
  DFU_UNSUBSCRIBE,
  CHECK_FIRMWARE,
  CHECK_FIRMWARE_FINISHED,
  CHECK_FIRMWARE_SUCCESS,
  CHECK_FIRMWARE_FAIL,
  SELECT_BATTERY_0V4,
  DOWNLOAD_FIRMWARE,
  DOWNLOAD_FIRMWARE_SUCCESS,
  DOWNLOAD_FIRMWARE_FAIL,
  DOWNLOAD_PERCENT,
  DFU_INIT,
  DFU_UPDATING,
  DFU_UPDATED,
  DFU_ERROR,
  DFU_PERCENT,
  APPLY_UPDATE
} from '../constants/bleDfuActionTypes'

import {
  BLE_INIT,
  BLE_SEARCH_START,
  BLE_SEARCH_STOP,
  BLE_SEARCH_ERROR,
  BLE_DEVICE_DISCOVERED,
  BLE_DEVICE_CONNECTING,
  BLE_DEVICE_CONNECTED,
  BLE_DEVICE_CONNECT_TIMEOUT,
  BLE_DEVICE_READY_TO_EDIT,
  BLE_DEVICE_DISCONNECTED,
  BLE_CHARACTERISTICS_DISCOVERED,
  BLE_UART_SUBSCRIBED,
  BLE_UART_UNSUBSCRIBED,
  BLE_LOAD_ENABLED,
  BLE_DORMANT_ENABLED,
  BLE_SYSTEM_RESET,
  BLE_BATTERY_UPDATE,
  IN_BLE_SEARCH_SCREEN,
  OUT_BLE_SEARCH_SCREEN
} from '../constants/bleActionTypes'

let requestCounter = 0
let MaxReqNumber = 0

export const API = axios.create({
  baseURL: `${api.path}/`,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

setupCache(API)

API.interceptors.request.use(
  (config) => {
    console.log('[index.js] - API.interceptors.request')
    if(config.url.includes('access-points')) {
      requestCounter ++
      if(requestCounter > MaxReqNumber) {
        MaxReqNumber = requestCounter
      }
    }
    if (
      !config.url.includes('check-adopted') &&
      !config.url.includes('stat') &&
      !config.url.includes('is_aps')
    ) {
      startRequest()
    }
    return config
  },
  (error) => Promise.reject(error),
)

API.interceptors.response.use(
  (response) => {
    if(response.config.url.includes('access-points')) {
      requestCounter --
      if(requestCounter === 0) {
        store.dispatch({
          type: SET_LOADING_PROGRESS,
          payload: { loadingProgress: 0 },
        })
      }
    }
    console.log('[index.js] - API.interceptors.response')
    finishRequest()
    return response
  },
  async (err) => {
    const { config, request } = err
    console.log('[index.js] - API.interceptors.response err', err, err.config, err.request)
    if (request.status === 401) {
      const refresh_token = await AsyncStorage.getItem('refresh_token')
      const { status, data } = await API.post(
        'oauth/v2/token',
        JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token,
          client_id: api.client_id,
          client_secret: api.client_secret,
        }),
      )

      if (status === 200) {
        await AsyncStorage.multiSet([
          ['access_token', data.access_token],
          ['refresh_token', data.refresh_token],
        ])
        API.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
        config.headers.Authorization = `Bearer ${data.access_token}`

        return axios(config)
      }
    }
    if(requestCounter > 0) {
      requestCounter --
    }
    console.log('[index.js] - API.interceptors.response')
    finishRequest()
    return Promise.reject(err)
  },
)


const startRequest = () => {
  store.dispatch({
    type: LOADING_REQUEST,
    payload: { on: true, counter: -100, maxNum: MaxReqNumber },
  })
}

const finishRequest = () => {
  store.dispatch({
    type: LOADING_REQUEST,
    payload: { on: false, counter: requestCounter, maxNum: MaxReqNumber },
  })
}

export const cancelRequest = ({ navigate }) => {
  navigate('TabScreens', {screen: 'DashboardScreen', params: {screen: 'DashboardScreen'}})
}

const getUser = (navigate) => async (dispatch) => {
  try {
    const { data: userData } = await API.get('api/me')
    const {
      data: {
        data: { items: team },
      },
    } = await API.get('api/company/users')
    dispatch({
      type: GET_USER,
      payload: { data: { ...userData, team } },
    })
    navigate('TabScreens', {screen: 'DashboardScreen', params: {screen: 'DashboardScreen'}})
    await getNetworks()(dispatch)
    console.log('[index.js] - getUser -> getNetworks')
    await getCaptivePortals()(dispatch)
    console.log('[index.js] - getUser -> getCaptivePortals')
    // await getAccessPoints()(dispatch)
  } catch (err) {
    const { response } = err
    const {
      data: { error_description, error },
    } = response
    AlertHelper.alert('error', 'Error', error ? error.message : error_description)
  }
}

const getToken = (navigate, body) => async (dispatch) => {
  try {
    const requestBody = JSON.stringify({
      ...body,
      client_id: api.client_id,
      client_secret: api.client_secret,
    })
    //console.log('[index.js] - getToken 0')
    const { data } = await API.post('oauth/v2/token', requestBody)
    //console.log('[index.js] - getToken 1')
    const { access_token, refresh_token } = data

    await AsyncStorage.multiSet([
      ['access_token', access_token],
      ['refresh_token', refresh_token],
    ])
    //console.log('[index.js] - getToken 2')
    API.defaults.headers.common.Authorization = `Bearer ${access_token}`

    await keychain.setGenericPassword(body.username, body.password)
    //console.log('[index.js] - getToken 3')
    await getUser(navigate)(dispatch)
  } catch (err) {
    const { response } = err
    if (response) {
      const {
        data: { error_description, error },
      } = response
      AlertHelper.alert('error', 'Error', error?.message || error_description)
      await logout({ navigate })(dispatch)
      navigate('LoginStackScreens', {screen: 'Login'})
    } else {
      console.log('[index.js] - getToken err logout', err)
      await logout({ navigate })(dispatch)
    }
  }
}

let networksSocket = false
let nodesSocket = false
let sharedNetworksSocket = false
let sharedMembersSocket = false
// let alertsSocket

const connectToSocket = async (dispatch) => {
  const { company, id } = store.getState().user.data.data
  const token = await AsyncStorage.getItem('access_token')
  const networkPath = websockets.getWebSocketPaths.network(company, id)
  const sharedNetworksPath = websockets.getWebSocketPaths.sharedNetworks(id)
  const sharedMembersPath = websockets.getWebSocketPaths.sharedMembers(company)
  const nodePath = websockets.getWebSocketPaths.node(company, id)
  // const alertsPath = websockets.getWebSocketPaths.alerts(company, id)
  const types = {
    NETWORK_SHARED,
    NETWORK_UNSHARED,
    NETWORK_CREATED: SAVE_NETWORK,
    NETWORK_EDITED: EDIT_NETWORK,
    NETWORK_DELETED: DELETE_NETWORK,
    ACCESS_POINT_CREATED: ADD_NODE,
    ACCESS_POINT_EDITED: EDIT_NODE,
    ACCESS_POINT_DELETED: DELETE_NODE,
  }

  const handler = (response) => {
    batch(() => {
      response.forEach(({ code, data }) => {
        dispatch({
          type: types[code],
          payload: { data },
        })
      })
    })
  }

  const membersHandler = (data) => {
    // batch(() => {
    //   data.forEach(({ code, data }) => {
    //     dispatch({
    //       type: '',
    //       payload: { data },
    //     })
    //   })
    // })
  }

  if (!networksSocket || networksSocket.readyState === WebSocket.CLOSED) {
    networksSocket = websockets.connectToSocket(networkPath, token, handler)
  }

  if (!nodesSocket || nodesSocket.readyState === WebSocket.CLOSED) {
    nodesSocket = websockets.connectToSocket(nodePath, token, handler)
  }

  if (!sharedNetworksSocket || sharedNetworksSocket.readyState === WebSocket.CLOSED) {
    sharedNetworksSocket = websockets.connectToSocket(sharedNetworksPath, token, handler)
  }

  if (!sharedMembersSocket || sharedMembersSocket.readyState === WebSocket.CLOSED) {
    sharedMembersSocket = websockets.connectToSocket(sharedMembersPath, token, membersHandler)
  }

  // if (!alertsSocket) {
  //   alertsSocket = websockets.connectToSocket(alertsPath, token, handler)
  // }
}

export const checkSocketsStatus = () => {
  return !!(networksSocket && nodesSocket && sharedMembersSocket && sharedNetworksSocket)
}



const getNetworksWithAps = () => async (dispatch) => {
  const {
    data: {
      data: { items: sharedCompanies },
    },
  } = await API.get('api/shared/companies?limit=999')
  console.log('[index.js] - getNetworksWithAps -> data')
  // const sharedURLs = sharedCompanies.map(({ id }) => API.get(`api/networks/access-points?company=${id}`))
  // sharedURLs.unshift(API.get('api/networks/access-points?limit=999'))
  // const sharedURLs = sharedCompanies.map(({ id }) => API.get(`api/shared/companies/${id}/networks?limit=999`))

  const sharedURLs = sharedCompanies.map(({ id }) => API.get(`api/networks/access-points?company=${id}&?limit=999`))
  //console.log('[index.js] - getNetworksWithAps -> sharedCompanies', sharedCompanies)
  sharedURLs.unshift(API.get('api/networks/access-points?limit=999'))
  //console.log('[index.js] - getNetworksWithAps -> sharedURLs', sharedURLs)
  MaxReqNumber = sharedURLs.length
  requestCounter = 0
  const result = await Promise.all(sharedURLs)
  MaxReqNumber = 0
  requestCounter = 0
  //finishRequest()
  //console.log('[index.js] - getNetworksWithAps -> result', result)
  const status = result && result.length ? 200 : null
  //console.log('[index.js] - getNetworksWithAps -> status', status)
  const networksWithNodes = [].concat(...result.map((item) => item.data.data))
  //console.log('[index.js] - getNetworksWithAps -> networksWithNodes', networksWithNodes)
  if (status === 200) {
    dispatch({
      type: GET_NETWORKS,
      payload: networksWithNodes,
    })
  }

  // await connectToSocket(dispatch)
  finishRequest()
}

const getNetworks = () => async (dispatch) => {
  try {
    const networksResponse = await API.get('api/networks?limit=999')
    const companiesNetworksResponse = await API.get('api/shared/companies/networks?limit=999')

    const {
      data: {
        data: { items: networks = [] },
      },
    } = networksResponse

    const {
      data: { data: sharedNetworks = [] },
    } = companiesNetworksResponse

    const networksWithNodes = [].concat(...networks, ...sharedNetworks.map((item) => item.networks))

    dispatch({
      type: GET_NETWORKS,
      payload: networksWithNodes,
    })
    
    await connectToSocket(dispatch)
    console.log('[index.js] - getNetworks -> connectToSocket')
    await getNetworksWithAps()(dispatch)
    console.log('[index.js] - getNetworks -> getNetworksWithAps')
  } catch (err) {
    console.log(err)
  }
}

export const refreshNetwork = () => async (dispatch) => {
  console.log('[index.js] - refreshNetwork')
  await getNetworks()(dispatch)
  // await getAccessPoints()(dispatch)
}

export const refreshOneNetwork = (networkId) => async (dispatch) => {
  try {
    const { status, data } = await API.get(`/api/networks/${networkId}?is_aps=true`)
      console.log('[index.js] - refreshOneNetwork data', data)
      dispatch({
        type: EDIT_NETWORK,
        payload: data,
      })
  } catch ({ response }) {
    const { error_description } = response.data
    AlertHelper.alert('error', 'Error', error_description)
  } 
}

export const getNetworkWithNodes = (id) => async (dispatch) => {
  const { status, data } = await API.get(`api/networks/${id}?is_aps=true`) // /access-points?limit=999
  if (status === 200) {
    dispatch({
      type: EDIT_NETWORK,
      payload: data,
    })
  }
}

const getCaptivePortals = () => async (dispatch) => {
  const { status, data } = await API.get('api/captive-portals?limit=999').catch((err) => err.response)

  if (status === 200) {
    dispatch({ type: GET_CAPTIVE_PORTALS, payload: data.data.items })
  }
}

export const getAccessPoints = ({ navigate }) => async (dispatch) => {
  const { status, data } = await API.get('api/all/access-points').catch((err) => err.response)

  console.log("[index.js] GETACCESSPOINTS... ");
  if (status === 200) {
    dispatch({ type: GET_ACCESS_POINTS, payload: data.data })
  }
}

export const checkToken = ({ navigate }) => async (dispatch) => {
  const refresh_token = await AsyncStorage.getItem('refresh_token')
  const { isConnected } = await NetInfo.fetch()

  if (refresh_token) {
    if (isConnected) {
      const body = {
        grant_type: 'refresh_token',
        refresh_token,
      }

      getToken(navigate, body)(dispatch)
    } else {
      navigate('BLESearchOffline')
    }
  } else {
    logout({ navigate })(dispatch)
    // navigate('Login')
  }
}

export const login = ({ navigate }, { email: username, password }) => async (dispatch) => {
  console.log('[index.js] - login username: ', username)
  console.log('[index.js] - login password: ', password)
  const body = {
    grant_type: 'password',
    username,
    password,
  }
  await getToken(navigate, body)(dispatch)
}

export const register = (body) => async (dispatch) => {
  const {
    status,
    data: { message, error_description },
  } = await API.post('registration', body).catch((err) => err.response)

  if (status === 200) {
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const registerConfirm = ({ popToTop }, body, token) => async (dispatch) => {
  const {
    status,
    data: { message, error_description },
  } = await API.post(`company/invitation/${token}`, body).catch((err) => err.response)

  if (status === 200) {
    popToTop()
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const recoveryPassword = (body) => async (dispatch) => {
  const {
    status,
    data: { message, error_description },
  } = await API.post('reset/password', body).catch((err) => err.response)

  if (status === 200) {
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const confirmRecoveryPassword = ({ popToTop }, body, token) => async (dispatch) => {
  const {
    status,
    data: { message, error_description },
  } = await API.put(`reset/password/${token}`, body).catch((err) => err.response)

  if (status === 200) {
    popToTop()
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const inviteTeamMember = (body) => async (dispatch) => {
  const {
    status,
    data: { message, error_description },
  } = await API.post('api/company/invitation', body).catch((err) => err.response)

  if (status === 200) {
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const changeUserData = (body) => async (dispatch) => {
  const {
    status,
    data: { data, message, error_description },
  } = await API.put('api/me', body).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: CHANGE_USER_DATA,
      payload: { data },
    })
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const changePassword = (navigation, body) => async (dispatch) => {
  const {
    status,
    data,
    data: { error, error_description },
  } = await API.put('api/change/password', body).catch((err) => err.response)

  if (status === 200) {
    if (navigation) navigation.goBack(null)
    AlertHelper.alert('info', 'Success', data.message[0])
  } else if (error === 'PASSWORDS_SAME') {
    AlertHelper.alert('error', 'Error', 'New password must be different from previous')
  } else if (error === 'NEW_PASSWORD_NOT_PROVIDED') {
    AlertHelper.alert('error', 'Error', 'New password not provided')
  } else if (error === 'CONFIRM_PASSWORD_NOT_PROVIDED') {
    AlertHelper.alert('error', 'Error', 'Confirm password not provided')
  } else if (error === 'PASSWORD_VALIDATION_ERROR') {
    AlertHelper.alert('error', 'Error', 'Password is not valid')
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const changeEmail = (navigation, body) => async (dispatch) => {
  const { status, data } = await API.post('api/change/email', body).catch((err) => err.response)

  if (status === 200) {
    navigation.replace('ChangeUserEmailDone', { body })
    AlertHelper.alert('info', 'Success', data.message[0])
  } else {
    console.log('[index.js] - ChangeUserEmail Failed', body)
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const sendEmailCode = (navigation, code, body) => async (dispatch) => {
  const {
    status,
    data: { data, message, error_description },
  } = await API.put(`api/change/email/${code}`, body).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: CHANGE_USER_DATA,
      payload: { data },
    })
    navigation.goBack(null)
    AlertHelper.alert('info', 'Success', message[0])
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const deleteUser = (id) => async (dispatch) => {
  const { status, data } = await API.delete(`api/company/users/${id}`).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: DELETE_USER,
      payload: { id },
    })
    AlertHelper.alert('info', 'Success', data.message[0])
  } else {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const editUserName = (id, body) => async (dispatch) => {
  const { status, data } = await API.put(`api/company/users/${id}`, body).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: EDIT_TEAM_USER,
      payload: { id, body },
    })
  } else {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const logout = ({ navigate }) => async (dispatch) => {
  // networksSocket.close()
  // nodesSocket.close()
  // sharedNetworksSocket.close()
  // sharedMembersSocket.close()

  if (networksSocket && networksSocket.readyState !== WebSocket.CLOSED) await networksSocket.close()
  if (nodesSocket && nodesSocket.readyState !== WebSocket.CLOSED) await nodesSocket.close()
  if (sharedNetworksSocket && sharedNetworksSocket.readyState !== WebSocket.CLOSED) await sharedNetworksSocket.close()
  if (sharedMembersSocket && sharedMembersSocket.readyState !== WebSocket.CLOSED) await sharedMembersSocket.close()

  networksSocket = null
  nodesSocket = null
  sharedNetworksSocket = null
  sharedMembersSocket = null

  await persistor.purge()
  await AsyncStorage.clear()
  await batch(() => {
    dispatch({ type: CLEAR_USER_DATA })
    dispatch({ type: CLEAR_NETWORK_DATA })
    dispatch({ type: CLEAR_ALERTS })
    dispatch({ type: CLEAR_SHARED_USERS })
  })
  console.log('[index.js] - Logged Out')
  // await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'persist:root'])
  navigate('LoginStackScreens', {screen: 'Login'})
}

export const getNetworkHistory = (id, hoursAgo = 2) => async (dispatch) => {
  const minutesCorrection = moment().format('mm') % 5
  // eslint-disable-next-line no-nested-ternary
  const interval = hoursAgo >= 720 ? 86400 : hoursAgo >= 24 ? 3600 : 300

  const dateEnd = moment().utc().subtract(minutesCorrection, 'm').format('YYYY-MM-DD-HH-mm')

  const dateStart = moment()
    .utc()
    .subtract(hoursAgo, 'h')
    .subtract(minutesCorrection, 'm')
    // .subtract(5, 'm')
    .format('YYYY-MM-DD-HH-mm')

  const period = `?date_start=${dateStart}&date_end=${dateEnd}&interval=${interval}`

  const {
    status,
    data: { data },
  } = await API.get(`api/networks/${id}/mobile-states${period}`).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: GET_NETWORK_HISTORY,
      payload: { data, networkId: id },
    })
  }
}

export const getNetworkHistoryData = async (id, hoursAgo = 2) => {
  const minutesCorrection = moment().format('mm') % 5

  const dateEnd = moment().utc().subtract(minutesCorrection, 'm').format('YYYY-MM-DD-HH-mm')

  const dateStart = moment()
    .utc()
    .subtract(hoursAgo, 'h')
    .subtract(minutesCorrection, 'm')
    .subtract(5, 'm')
    .format('YYYY-MM-DD-HH-mm')

  const period = `?date_start=${dateStart}&date_end=${dateEnd}`

  const {
    status,
    data: { data },
  } = await API.get(`api/networks/${id}/states${period}`).catch((err) => err.response)

  if (status === 200) {
    return data
  }
  return {}
}

export const setRequestTimeRangeInterval = ({ interval, selectedPeriod }) => (dispatch) => {
  dispatch({
    type: SELECT_TIME_RANGE,
    payload: {
      interval,
      selectedPeriod,
    },
  })
}

export const getNetworkStatistic = (id, hoursAgo = 2, order, navigate) => async (dispatch) => {
  // eslint-disable-next-line no-nested-ternary
  const intervalParam = hoursAgo >= 720 ? 86400 : hoursAgo >= 24 ? 3600 : 300
  const minutesCorrection = moment().format('mm') % 5

  const dateEnd = moment().utc().subtract(minutesCorrection, 'm').format('YYYY-MM-DD-HH-mm')

  const dateStart = moment().utc().subtract(hoursAgo, 'h').subtract(minutesCorrection, 'm').format('YYYY-MM-DD-HH-mm')

  const interval = `&interval=${intervalParam}`
  const period = `?date_start=${dateStart}&date_end=${dateEnd}${interval}${order ? `&order=${order}` : ''}`
  const getChartsValues = (chartData) => [
    ...chartData.map((item) => item.download),
    ...chartData.map((item) => item.upload),
  ]
  const getOverviewUtilizationData = (chartData) =>
    chartData.map(({ upload_throughput, upload, download_throughput, download }) => {
      let up = (upload_throughput / upload) * 100
      let down = (download_throughput / download) * 100

      if (upload === 0) {
        up = 0
      }
      if (upload < upload_throughput) {
        up = 100
      }

      if (download === 0) {
        down = 0
      }
      if (download < download_throughput) {
        down = 100
      }
      return {
        utilizationUp: up,
        utilizationDown: down,
      }
    })
  const getChartData = (chart) => {
    const range = chart[0].stats.length
    const data = []
    for (let i = 0; i < range; i += 1) {
      const tmp = {
        download: 0,
        upload: 0,
        created_at: '',
        download_throughput: 0,
        upload_throughput: 0,
      }
      chart.forEach((ch) => {
        if (ch.is_gateway && ch.stats && ch.stats[i] && ch.stats[i].created_at) {
          tmp.download += +ch.stats[i].download
          tmp.upload += +ch.stats[i].upload
          tmp.created_at = ch.stats[i].created_at
          tmp.download_throughput += +ch.stats[i].download_throughput
          tmp.upload_throughput += +ch.stats[i].upload_throughput
        }
      })

      if (!data[i]) {
        data[i] = { ...tmp }
      }
    }

    return data
  }

  const getOverviewCapacity = (chartData) =>
    chartData.map(({ download, upload }) => Number(add(download, upload).toFixed(2)))

  const getOverviewThroughput = (chartData) =>
    chartData.map(({ download_throughput, upload_throughput }) =>
      Number(add(download_throughput, upload_throughput).toFixed(2)),
    )

  try {
    const {
      data: { data: chart },
    } = await API.get(`api/networks/${id}/access-points/statistic${period}`)

    // const {
    //   data: { data: summary = [] },
    // } = await API.get(`api/networks/${id}/access-points/statistic${period}&is_sum=true`).catch(err => err.response)

    if (chart.length) {
      const chartData = getChartData(chart)
      const overviewCapacity = getOverviewCapacity(chartData)
      const overviewThroughput = getOverviewThroughput(chartData)
      const overviewUtilizationData = getOverviewUtilizationData(chartData)
      const allData = getChartsValues(chartData)

      dispatch({
        type: GET_NETWORK_STATISTIC,
        payload: { data: { chart, chartData, allData, overviewCapacity, overviewThroughput, overviewUtilizationData } },
      })
    }
  } catch (err) {
    const { response } = err

    if (response) {
      const {
        data: { error },
      } = response
      if (error === 'NETWORK_NOT_FOUND') {
        // navigate('Dashboard')
      }
    }
  }
  return { chart: [], summary: [] }
}

export const getNetworkStatisticData = async (id, hoursAgo = 2, order) => {
  const minutesCorrection = moment().format('mm') % 5

  const dateEnd = moment().utc().subtract(minutesCorrection, 'minutes').format('YYYY-MM-DD-HH-mm')

  const dateStart = moment()
    .utc()
    .subtract(hoursAgo, 'hours')
    .subtract(minutesCorrection, 'minutes')
    .subtract(5, 'm')
    .format('YYYY-MM-DD-HH-mm')

  const period = `?date_start=${dateStart}&date_end=${dateEnd}${order ? `&order=${order}` : ''}`

  const {
    status,
    data: { data: chart },
  } = await API.get(`api/networks/${id}/access-points/statistic${period}`).catch((err) => err.response)

  const {
    data: { data: summary = [] },
  } = await API.get(`api/networks/${id}/access-points/statistic${period}&is_sum=true`).catch((err) => err.response)

  if (status === 200) {
    return { chart, summary }
  }
  return { chart: [], summary: [] }
}

export const createNetwork = ({ navigate }, networkData) => async (dispatch) => {
  const {
    status,
    data: { data, error_description },
  } = await API.post('api/networks', networkData).catch((err) => err.response)

  if (status === 200) {
    dispatch({
      type: SAVE_NETWORK,
      payload: { data },
    })
    navigate('CreateNetworkDone', { networkId: data.id })
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const getSSID = (networkId, order) => async () => {
  try {
    const data = await API.get(`/api/networks/${networkId}/ssids/${order}`)
    return data
  } catch (err) {
    return AlertHelper.alert('error', 'Error', '')
  }
}

export const createSSID = (networkId, SSIDData) => async (dispatch) => {
  const { networks } = store.getState().networks
  const currentNetwork = networks.find(({ id }) => id === networkId)
  try {
    const { data } = await API.get(`/api/networks/${networkId}/ssids/orders`)
    const { data: orders } = data
    const [order] = orders
    if (order) {
      const { data: response } = await API.post(`/api/networks/${networkId}/ssids/${order}`, SSIDData)
      currentNetwork.ssid.push(response.data)
      dispatch({
        type: EDIT_NETWORK,
        payload: { data: currentNetwork },
      })
      AlertHelper.alert('info', 'Success', response.message.toString())
    }
  } catch ({ response }) {
    const { error_description } = response.data
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const editSSID = (networkId, body) => async (dispatch) => {
  const { networks } = store.getState().networks
  const currentNetwork = networks.find(({ id }) => id === networkId)
  const currentSSIDs = currentNetwork?.ssid || []

  try {
    const {
      data: { data },
    } = await API.put(`/api/networks/${networkId}/ssids/${body.order}`, body)

    currentNetwork.ssid = currentSSIDs.map((ssid) => {
      if (ssid.id === data.id) {
        return data
      }
      return ssid
    })

    dispatch({
      type: EDIT_NETWORK,
      payload: { data: currentNetwork },
    })

    AlertHelper.alert('info', 'Success', data.message)
  } catch ({ response }) {
    const {
      error: { message },
      error_description,
    } = response.data
    AlertHelper.alert('error', `Error ${response.status}`, message || error_description)
  }
}

export const deleteSSID = (networkId, order) => async (dispatch) => {
  const { networks } = store.getState().networks
  const currentNetwork = networks.find(({ id }) => id === networkId)
  const currentSSIDs = currentNetwork?.ssid || []

  try {
    const { data } = await API.delete(`/api/networks/${networkId}/ssids/${order}`)
    currentNetwork.ssid = currentSSIDs.filter(({ order: el }) => el !== order)
    dispatch({
      type: EDIT_NETWORK,
      payload: { data: currentNetwork },
    })
    AlertHelper.alert('info', 'Success', data.message)
  } catch (err) {
    AlertHelper.alert('error', 'Error', '')
  }
}

export const editNetwork = (network) => async (dispatch) => {
  try {
    const {
      data,
      data: { data: updated },
    } = await API.put(`api/networks/${network.id}`, network)
    dispatch({
      type: EDIT_NETWORK,
      payload: { data: updated },
    })
    AlertHelper.alert('info', 'Success', data.message[0])
  } catch ({ response }) {
    const {
      error: { message },
      error_description,
    } = response.data
    AlertHelper.alert('error', 'Error', message || error_description)
  }
}

export const editNode = (navigation, node) => async (dispatch) => {
  try {
    const {
      data,
      data: { data: updatedNode },
    } = await API.put(`api/networks/${node.networkId}/access-points/${node.id}`, node)
    dispatch({
      type: EDIT_NODE,
      payload: { data: updatedNode },
    })
    AlertHelper.alert('info', 'Success', data.message[0])
    await getNetworkWithNodes(node.networkId)(dispatch)
    getNetworkWithNodes(updatedNode.network_id)(dispatch)
    if (navigation) navigation.dispatch(StackActions.pop(2))
  } catch (error) {
    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const reassignNodes = (navigation, selectedNetworks, targetNetworkId, allIds) => async (dispatch) => {
  try {
    const request = Object.keys(selectedNetworks)
      .map((networkId) =>
        selectedNetworks[networkId].map((nodeId) => ({ node: nodeId, network: Number(networkId) })).flat(),
      )
      .flat()
    console.log('[index.js] - reassignNodes request', request)
    const { data } = await API.patch('/api/access-points/reassign', { access_points: JSON.stringify(request) })

    const { networks } = store.getState().networks
    const allNodes = networks.map((network) => network.aps).flat()

    // The networks from which the nodes were taken out
    const newNetworks = Object.keys(selectedNetworks).map((networkId) => {
      const net = networks.find((el) => el.id === Number(networkId))
      net.aps = net.aps.filter((el) => !selectedNetworks[networkId].includes(el.id))
      return net
    })

    // The network to which we will add new nodes
    const targetNetwork = networks.find((net) => net.id === Number(targetNetworkId))

    // Nodes to be added to the target network
    const targetNodes = allNodes.filter((node) => allIds.includes(node.id))
    targetNetwork.aps = [...targetNetwork.aps, ...targetNodes]

    const newList = networks.map((o) => {
      const itemNode = [targetNetwork, ...newNetworks].find((el) => o.id === el.id)
      if (itemNode) {
        return itemNode
      }
      return o
    })

    AlertHelper.alert('info', 'Success', data0.message[0])

    return dispatch({
      type: EDIT_NETWORK,
      payload: newList,
    })
  } catch (error) {

    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const createNode = (navigation, network, nodeData, newNetwork) => async (dispatch) => {
  try {
    const {
      data: { data },
    } = await API.post(`api/networks/${network.id}/access-points`, nodeData)
    dispatch({
      type: ADD_NODE,
      payload: { data },
    })
    navigation.navigate('CreateNodeDone', { nodeData, networkName: network.name, id: network.id, newNetwork })
  } catch (error) {
    console.warn('error in createNode', error)
    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const deleteNode = (navigation, network, nodeData) => async (dispatch) => {
  try {
    const { data } = await API.delete(`/api/networks/${network.id}/access-points/${nodeData.id}`)
    dispatch({
      type: DELETE_NODE,
      payload: { data: { network_id: network.id, id: nodeData.id } },
    })
    AlertHelper.alert('info', 'Success', data.message[0])
    if (navigation) navigation.navigate('Network', { networkId: network.id })
  } catch (error) {
    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const rebootNode = (navigation, network, nodeData) => async (dispatch) => {
  console.log('[index.js] - rebootNode I am here', network)
  const { status, data } = await API.put(`/api/networks/${network.id}/access-points/${nodeData.id}/reboot`).catch(
    (err) => err.response,
  )
  console.log('[index.js] - rebootNode response', status, data)
  if (status === 200) {
    AlertHelper.alert('info', 'Success', data.message[0])
  } else {
    console.log('[index.js] - rebootNode error', status, data.message[0])
    AlertHelper.alert('error', 'Error', data.message[0])
  }
}

export const checkNodeByMac = (macs) => async () => {
  console.log("CHECK NODE BY MAC macs: ", macs);
  try {
    const { data } = await API.get(`/api/access-points/check-adopted?version=2&macs=${macs}`)
    console.log('CHECK NODE BY MAC DATA: ', data.data)
    return data
  } catch (err) {
    console.log('CHECK NODE BY MAC ERROR: ', err.response)
    return null
  }
}

export const deleteNetwork = (navigation, networkId) => async (dispatch) => {
  try {
    const { data } = await API.delete(`api/networks/${networkId}`)
    if (navigation) navigation.navigate('TabScreens', {screen: 'DashboardScreen', params: {screen: 'DashboardScreen'}})

    if (data) {
      dispatch({
        type: DELETE_NETWORK,
        payload: { data: { id: networkId } },
      })
      AlertHelper.alert('info', 'Success', data.message[0])
    }
  } catch (error) {
    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const getAlerts = (date_start = '', date_end = '') => async (dispatch) => {
  const {
    status,
    data: { data },
  } = await API.get(`/api/alerts?date_start=${date_start}&date_end=${date_end}`).catch((err) => err.response)
  if (status === 200) {
    dispatch({
      type: GET_ALERTS,
      payload: { data },
    })
  } else {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const archiveAlert = (id) => async (dispatch) => {
  const { status, data } = await API.delete(`api/alerts/${id}`).catch((err) => err.response)

  if (status === 200) {
    getAlerts()(dispatch)
    // AlertHelper.alert('info', 'Success', data.message[0])
  } else {
    AlertHelper.alert('error', 'Error', data.error_description || data.error.message)
  }
}

export const archiveAllAlerts = () => async (dispatch) => {
  const { status, data } = await API.delete('api/alerts').catch((err) => err.response)

  if (status === 200) {
    getAlerts()(dispatch)
    AlertHelper.alert('info', 'Success', data.message[0])
  } else {
    AlertHelper.alert('error', 'Error', data.error_description || data.error.message)
  }
}

export const getSharedUsers = (networkId) => async (dispatch) => {
  const {
    status,
    data: { data, error_description },
  } = await API.get(`/api/networks/${networkId}/shared-users`).catch((err) => err.response)
  console.log("[index.js] - getSharedUsers", status, data)
  if (status === 200) {
    dispatch({
      type: GET_SHARED_USERS,
      payload: { data },
    })
  } else {
    AlertHelper.alert('error', 'Error', error_description)
  }
}

export const updateUserSharedRole = (networkId, user) => async (dispatch) => {
  const roleToBeUpdated = "{\"" + networkId + "\": \"" + user.role + "\"}"
  const id = user.id
  const { status, data } = await API.patch(`/api/shared-users/${id}`, { id, networks: roleToBeUpdated }).catch((err) => err.response)
  console.log('[index.js] - updateUserSharedRole', data, roleToBeUpdated, user.role)

  if (status === 200) {
    AlertHelper.alert('info', 'Success', data.message[0])
    await getSharedUsers(networkId)(dispatch)
  } else {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const shareNetwork = (networkId, { email, role }, navigation) => async (dispatch) => {
  try {
    const {
      data: { message },
    } = await API.post(`/api/networks/${networkId}/shared-users`, { email, role })

    await getSharedUsers(networkId)(dispatch)

    AlertHelper.alert('info', 'Success', message.toString() || 'Network have been shared')

    navigation.goBack(null)
  } catch (error) {
    const { response } = error
    AlertHelper.alert('error', 'Error', response.data)
  }
}

export const unsubscribeFromNetwork = (navigation, networks) => async (dispatch) => {
  try {
    const { data } = await API.patch('/api/shared/companies/networks/unsubscribe', networks)
    AlertHelper.alert('info', 'Success', data.message[0])
    const { networks: networkId } = networks
    const { networks: allNetworks } = store.getState().networks
    const currentNetwork = allNetworks.find((network) => network.id === networkId)
    currentNetwork.is_shared = false

    dispatch({
      type: EDIT_NETWORK,
      payload: { data: currentNetwork },
    })
    if (navigation) navigation.goBack(null)
  } catch (error) {
    const { response } = error
    if (response) {
      const {
        error: { message },
        error_description,
      } = response.data
      AlertHelper.alert('error', 'Error', message || error_description)
    }
  }
}

export const revokeUserAccess = (id, networks, networkId) => async (dispatch) => {
  // '{"networkId": false}'
  const networkToBeRevoked = "{\"" + networkId + "\": false}"
  const { status, data } = await API.patch(`/api/shared-users/${id}`, { id, networks:networkToBeRevoked }).catch((err) => err.response)
  if (status === 200) {
    AlertHelper.alert('info', 'Success', data.message[0])
    getSharedUsers(networkId)(dispatch)
  } else {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}

export const channelScan = (networkId, showAlert = true) => async (dispatch) => {
  const { status, data } = await API.post(`/api/networks/${networkId}/channel-scan`).catch((err) => err.response)
  if (status === 200 && showAlert) {
    AlertHelper.alert('info', 'Channel Scan initiated', 'Scanning can take up to 60 seconds')
  } else if (showAlert) {
    AlertHelper.alert('error', 'Error', data.error_description)
  }
}


export function dfuSubscribe() {
  console.log("[DFU ACTION] - DFU_SUBSCRIBE")
  return { type:  DFU_SUBSCRIBE }
}

export function dfuUnsubscribe() {
  console.log("[DFU ACTION] - DFU_UNSUBSCRIBE")
  return { type:  DFU_UNSUBSCRIBE }
}

export function checkFirmware() {
  console.log("[DFU ACTION] - CHECK_FIRMWARE")
  return { type: CHECK_FIRMWARE }
}

export function checkFirmwareFinished() {
  console.log("[DFU ACTION] - CHECK_FIRMWARE_FINISHED")
  return { type: CHECK_FIRMWARE_FINISHED }
}

export function checkFirmwareSuccess(firmware) {
  console.log("[DFU ACTION] - CHECK_FIRMWARE_SUCCESS")
  return { type: CHECK_FIRMWARE_SUCCESS, payload: {firmware: firmware} }
}

export function checkFirmwareFail(firmware) {
  console.log("[DFU ACTION] - CHECK_FIRMWARE_FAIL")
  return { type: CHECK_FIRMWARE_FAIL, payload: {firmware: firmware} }
}

export function selectBattery0v4() {
  console.log("[DFU ACTION] - SELECT_BATTERY_0V4")
  return { type: SELECT_BATTERY_0V4 }
}

export function downloadFirmware(name) {
  console.log("[DFU ACTION] - DOWNLOAD_FIRMWARE")
  return { type: DOWNLOAD_FIRMWARE, payload: {name: name} }
}

export function downloadFirmwareSuccess(name) {
  console.log("[DFU ACTION] - DOWNLOAD_FIRMWARE_SUCCESS")
  return { type: DOWNLOAD_FIRMWARE_SUCCESS, payload: {name: name} }
}

export function downloadFirmwareFail(name) {
  console.log("[DFU ACTION] - DOWNLOAD_FIRMWARE_FAIL")
  return { type: DOWNLOAD_FIRMWARE_FAIL, payload: {name: name} }
}

export function downloadPercent(percent) {
  return { type: DOWNLOAD_PERCENT, payload: {percent: percent} }
}

export function dfuInit() {
  console.log("[DFU ACTION] - DFU_INIT")
  return { type: DFU_INIT }
}

export function dfuUpdating(name, file) {
  console.log("[DFU ACTION] - DFU_UPDATING")
  return { type: DFU_UPDATING, payload: {name: name, file: file} }
}

export function dfuUpdated(name, file) {
  console.log("[DFU ACTION] - DFU_UPDATED")
  return { type: DFU_UPDATED, payload: {name: name, file: file} }
}

export function dfuError(name, file, error) {
  console.log("[DFU ACTION] - DFU_ERROR")
  return { type: DFU_ERROR, payload: {name: name, file: file, error: error} }
}

export function dfuPercent(percent) {
  return { type: DFU_PERCENT, payload: {percent: percent} }
}

export function dfuApplyUpdate() {
  console.log("[DFU ACTION] - APPLY_UPDATE")
  return { type: APPLY_UPDATE }
}

export function bleInit() {
  console.log("[BLE ACTION] - BLE_INIT")
  return { type: BLE_INIT }
}

export function bleSearchStart() {
  console.log("[BLE ACTION] - BLE_SEARCH_START")
  return { type: BLE_SEARCH_START }
}

export function bleSearchStop() {
  console.log("[BLE ACTION] - BLE_SEARCH_STOP")
  return { type: BLE_SEARCH_STOP }
}

export function bleSearchError(searchError) {
  console.log("[BLE ACTION] - BLE_SEARCH_ERROR")
  return { 
    type: BLE_SEARCH_ERROR,
    payload: { searchError: searchError }
  }
}

export function bleDeviceDiscovered(device) {
  console.log("[BLE ACTION] - BLE_DEVICE_DISCOVERED")
  return {
    type: BLE_DEVICE_DISCOVERED,
    payload: { device: device }
  }
}

export function bleDeviceConnecting(id) {
  console.log("[BLE ACTION] - BLE_DEVICE_CONNECTING")
  return {
    type: BLE_DEVICE_CONNECTING,
    payload: { connecting: id }
  };
}

export function bleDeviceConnected(device) {
  console.log("[BLE ACTION] - BLE_DEVICE_CONNECTED")
  return {
    type: BLE_DEVICE_CONNECTED,
    payload: { device: device }
  }
}

export function bleDeviceConnectTimeout() {
  console.log("[BLE ACTION] - BLE_DEVICE_CONNECT_TIMEOUT")
  return {
    type: BLE_DEVICE_CONNECT_TIMEOUT
  }
}

export function bleDeviceReadyToEdit() {
  console.log("[BLE ACTION] - BLE_DEVICE_READY_TO_EDIT")
  return {
    type: BLE_DEVICE_READY_TO_EDIT
  }
}

export function bleDeviceDisconnected() {
  console.log("[BLE ACTION] - BLE_DEVICE_DISCONNECTED")
  return {
    type: BLE_DEVICE_DISCONNECTED,
  }
}

export function bleCharacteristicsDiscovered(info) {
  console.log("[BLE ACTION] - BLE_CHARACTERISTICS_DISCOVERED")
  return {
    type: BLE_CHARACTERISTICS_DISCOVERED,
    payload: { info: info }
  }
}

export function bleServiceSubscribed(char) {
  console.log("[BLE ACTION] - BLE_UART_SUBSCRIBED")
  return {
    type: BLE_UART_SUBSCRIBED,
    payload: {characteristics: char}
  }
}

export function bleServiceUnsubscribed() {
  console.log("[BLE ACTION] - BLE_UART_UNSUBSCRIBED")
  return { type: BLE_UART_UNSUBSCRIBED }
}

export function bleLoadEnabled(isLoadEnabled) {
  console.log("[BLE ACTION] - BLE_LOAD_ENABLED")
  return { 
    type: BLE_LOAD_ENABLED, 
    payload: { isLoadEnabled: isLoadEnabled } 
  }
}

export function bleDormantEnabled(isDormantEnabled) {
  console.log("[BLE ACTION] - BLE_DORMANT_ENABLED")
  return { 
    type: BLE_DORMANT_ENABLED, 
    payload: { isDormantEnabled: isDormantEnabled } 
  }
}

export function bleSystemReset(isSystemReset) {
  console.log("[BLE ACTION] - BLE_SYSTEM_RESET")
  return { 
    type: BLE_SYSTEM_RESET, 
    payload: { isSystemReset: isSystemReset } 
  }
}

export function bleBatteryUpdate(batteryValue) {
  console.log("[BLE ACTION] - BLE_BATTERY_UPDATE")
  return { 
    type: BLE_BATTERY_UPDATE, 
    payload: { batteryValue: batteryValue } 
  }
}

export function setLoadingProgress(loadingProgress) {
  console.log("[LOAD ACTION] - SET_LOADING_PROGRESS", loadingProgress)
  return { 
    type: SET_LOADING_PROGRESS, 
    payload: { loadingProgress: loadingProgress } 
  }
}

export function inBLESearchScreen() {
  console.log("[BLE ACTION] - IN_BLE_SEARCH_SCREEN")
  return {
    type: IN_BLE_SEARCH_SCREEN
  }
}

export function outBLESearchScreen() {
  console.log("[BLE ACTION] - OUT_BLE_SEARCH_SCREEN")
  return {
    type: OUT_BLE_SEARCH_SCREEN
  }
}

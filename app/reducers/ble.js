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
  OUT_BLE_SEARCH_SCREEN,
  GET_ACCESS_POINTS
} from '../constants/bleActionTypes'

const initialState = {
  isSearching: false, 
  searchError: null, 
  mpp_discovered: false,
  discovered: [], 
  connecting: null,
  connected: null, 
  sub_characteristics: null,
  dfu: [],
  currentUserAps: [],
  otherUsersAps: [], 
  subscribed: false,
  isLoadEnabled: false,
  isDormantEnabled: false,
  isSystemReset: false,
  batteryValue: '0%',
  readyToEdit: false,
  inBLESearchScreenFlag: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case BLE_INIT:
      return { 
        ...state, 
        isSearching: false, 
        searchError: null, 
        mpp_discovered: false,
        discovered: [], 
        connecting: null,
        connected: null, 
        sub_characteristics: null,
        dfu: [], 
        subscribed: false,
        isLoadEnabled: false,
        isDormantEnabled: false,
        isSystemReset: false,
        batteryValue: '0%',
        readyToEdit: false,
        inBLESearchScreenFlag: false
      };
    case BLE_SEARCH_START:
      return { 
        ...state, 
        isSearching: true, 
        searchError: null, 
        mpp_discovered: false,
        discovered: [], 
        connecting: null,
        connected: null, 
        sub_characteristics: null,
        dfu: [], 
        subscribed: false,
        isLoadEnabled: false,
        isDormantEnabled: false,
        isSystemReset: false,
        batteryValue: '0%',
        readyToEdit: false,
      };
    case BLE_SEARCH_STOP:
      return { 
        ...state, 
        isSearching: false,
        connecting: null
      }
    case BLE_SEARCH_ERROR:
      return { 
        ...state, 
        isSearching: false,
        searchError: action.payload.searchError
      }
    case BLE_DEVICE_DISCOVERED:
      let discovered = state.discovered.slice(0)
      let l = discovered.length

      if (l !== 0) {
        let index = discovered.findIndex(device => device.id === action.payload.device.id)
        if (index === -1) {
          discovered.push(action.payload.device)
        }
      } else {
        discovered.push(action.payload.device)
      }
      
      return { 
        ...state, 
        mpp_discovered: true,
        discovered: discovered 
      }
    case BLE_DEVICE_CONNECTING:
      return { 
        ...state, 
        isSearching: false,
        connecting: action.payload.connecting,
        batteryValue: '0%',
        isLoadEnabled: false
      }
    case BLE_DEVICE_CONNECTED:
      return { 
        ...state, 
        subscribed: false,
        connected: action.payload.device
      }
    case BLE_DEVICE_CONNECT_TIMEOUT:
      return {
        ...state,
        connecting: null,
        connected: null
      }
    case BLE_DEVICE_READY_TO_EDIT: 
      return { 
        ...state, 
        readyToEdit: true
      }
    case BLE_DEVICE_DISCONNECTED:
      return { 
        ...state, 
        subscribed: false,
        connected: null,
        readyToEdit: false
      }
    case BLE_CHARACTERISTICS_DISCOVERED:
      return { 
        ...state,
        characteristics: action.payload.info.characteristics,
        services: action.payload.info.services
      }
    case BLE_UART_SUBSCRIBED:
      return {
        ...state,
        connecting: null,
        sub_characteristics: action.payload.characteristics,
        subscribed: true
      }
    case BLE_UART_UNSUBSCRIBED:
      return {
        ...state,
        subscribed: false
      }
    case BLE_LOAD_ENABLED:
      return {
        ...state,
        isLoadEnabled: action.payload.isLoadEnabled
      }
    case BLE_DORMANT_ENABLED:
      return {
        ...state,
        isDormantEnabled: action.payload.isDormantEnabled
      }
    case BLE_SYSTEM_RESET:
      return {
        ...state,
        isSystemReset: action.payload.isSystemReset
      }
    case BLE_BATTERY_UPDATE: 
      return {
        ...state,
        batteryValue: action.payload.batteryValue
      }
    case IN_BLE_SEARCH_SCREEN: 
      return { 
        ...state, 
        inBLESearchScreenFlag: true
      }
    case OUT_BLE_SEARCH_SCREEN: 
      return { 
        ...state, 
        inBLESearchScreenFlag: false
      }
    case GET_ACCESS_POINTS:
      return {
        ...state,
        currentUserAps: action.payload.current_users_aps,
        otherUsersAps: action.payload.other_users_aps
      }
    default:
      return state;
  }
}

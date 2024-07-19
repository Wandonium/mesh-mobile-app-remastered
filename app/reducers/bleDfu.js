import {
  DFU_SUBSCRIBE,
  DFU_UNSUBSCRIBE,
  DOWNLOAD_FIRMWARE,
  CHECK_FIRMWARE_FINISHED,
  DOWNLOAD_FIRMWARE_SUCCESS,
  DOWNLOAD_FIRMWARE_FAIL,
  DFU_INIT,
  DFU_UPDATED,
  DFU_UPDATING,
  DFU_ERROR,
  DFU_PERCENT, 
  DOWNLOAD_PERCENT, 
  CHECK_FIRMWARE, 
  CHECK_FIRMWARE_SUCCESS, 
  CHECK_FIRMWARE_FAIL,
  SELECT_BATTERY_0V4,
  APPLY_UPDATE
} from '../constants/bleDfuActionTypes'

// Default State for the Reducer
const initialState = { 
  isLoading: false, 
  firmwareData: {}, 
  version: 0.2, 
  canUpdate: false, 
  downloading: false, 
  downloaded: "", 
  updating: false, 
  updated: false, 
  download_percent: 0.0, 
  dfu_percent: 0.0,
  dfu_error: false,
  applyingUpdate: false,
  dfuBleMask: false,
  selectBattery0v4: false,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case DFU_SUBSCRIBE:
      return {
        ...state, 
        isLoading: false, 
        firmwareData: {}, 
        version: 0.2, 
        canUpdate: false, 
        downloading: false, 
        downloaded: "", 
        updating: false, 
        updated: false, 
        download_percent: 0.0, 
        dfu_percent: 0.0,
        dfu_error: false,
        applyingUpdate: false,
        dfuBleMask: false,
        selectBattery0v4: false,
      }

    case DFU_UNSUBSCRIBE:
      return {
        ...state, 
        isLoading: false, 
        firmwareData: {}, 
        version: 0.2, 
        canUpdate: false, 
        downloading: false, 
        downloaded: "", 
        updating: false, 
        updated: false, 
        download_percent: 0.0, 
        dfu_percent: 0.0,
        dfu_error: false,
        applyingUpdate: false,
        dfuBleMask: false,
        selectBattery0v4: false,
      }

    case CHECK_FIRMWARE:
      return {
        ...state, 
        isLoading: true
      }

    case CHECK_FIRMWARE_FINISHED:
      return {
        ...state, 
        isLoading: false
      }

    case CHECK_FIRMWARE_SUCCESS:
      return {
        ...state, 
        isLoading: false, 
        firmwareData: action.payload.firmware, 
        canUpdate: true
      }

    case CHECK_FIRMWARE_FAIL:
      return {
        ...state, 
        isLoading: false, 
        canUpdate: false,
        updating: false, 
        downloading: false,
        dfu_error: true,
        firmwareData: action.payload.firmware
      }
    case SELECT_BATTERY_0V4: 
      return {
        ...state,
        selectBattery0v4: true,
      }
    // Set downloading state to true
    case DOWNLOAD_FIRMWARE:
      return {
        ...state, 
        canUpdate: false,
        download_percent: 0,
        downloading: true,
        dfuBleMask: true,
        selectBattery0v4: false,
      }

    // Set downloading state to false, and add the downloaded file to list if necessary
    case DOWNLOAD_FIRMWARE_SUCCESS:
      return {
        ...state, 
        download_percent: 100,
        dfuBleMask: true
      };

    // If failed to download, set downloading to false
    case DOWNLOAD_FIRMWARE_FAIL:
      return {
        ...state, 
        downloading: false,
        dfuBleMask: false
      }

    case DOWNLOAD_PERCENT:
      return {
        ...state, 
        download_percent: action.payload.percent
      }

    // Set updated to false
    case DFU_INIT:
      return {
        ...state, 
        downloading: false, 
        updating: true,
        updated: false,
        dfu_percent: 0
      }

    // Set updating to true
    case DFU_UPDATING:
      return {
        ...state, 
        updating: true
      }

    // Set updating to false, and set updated to true
    case DFU_UPDATED:
      return {
        ...state, 
        applyingUpdate: false,
        version: state.firmwareData.version, 
        updating: false, 
        updated: true, 
        downloaded: "", 
        canUpdate: false,
        dfu_error: false,
        dfuBleMask: false
      }

    // set updating to false, and add error message
    case DFU_ERROR:
      return {
        ...state,
        applyingUpdate: false,
        isLoading: false,
        canUpdate: false,
        updating: false, 
        downloading: false,
        dfu_error: true,
        dfuBleMask: false
      }

    case DFU_PERCENT:
      return {
        ...state, 
        dfu_percent: action.payload.percent
      }

    case APPLY_UPDATE:
      return {
        ...state,
        applyingUpdate: true,
        updating: false, 
        updated: false, 
        downloaded: "", 
        canUpdate: false,
        dfu_error: false
      }

    // If we can't handle it, return the state unchanged
    default:
      return state;
  }
};

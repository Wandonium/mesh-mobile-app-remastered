import {
  SET_LOADING_PROGRESS
} from '../constants/actionTypes'

const initialState = {
  isLoading: false, 
  loadingCounter: -100, 
  maxNum: 0,
  loadingProgress: 0,
}

export default (state = initialState, { type, payload }) => {
  // const matches = /(.*)_(NETWORKS|NODE|NETWORK|USER|REQUEST)/.exec(type)
  if(type === SET_LOADING_PROGRESS) {
    console.log('[loading.js] - here', payload.loadingProgress)
    return { ...state, loadingProgress: payload.loadingProgress }
  }
  const matches = /(.*)_(REQUEST)/.exec(type)
  
  if (!matches) return state
  console.log('[loading.js] - payload', payload)
  const [, , requestState] = matches
  return { ...state, isLoading: payload.on && requestState === 'REQUEST', loadingCounter: payload.counter, maxNum: payload.maxNum }
}

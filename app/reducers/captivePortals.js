import { GET_CAPTIVE_PORTALS } from '../constants/actionTypes'

const initialState = {
  data: [],
}

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_CAPTIVE_PORTALS:
      return { ...state, data: action.payload }

    default:
      return state
  }
}

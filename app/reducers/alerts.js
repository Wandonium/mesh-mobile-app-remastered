import { GET_ALERTS, CLEAR_ALERTS } from '../constants/actionTypes'

const initialState = {
  data: {
    items: '',
  },
}

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_ALERTS:
      return { ...state, data: action.payload.data }

    case CLEAR_ALERTS:
      return { ...initialState }

    default:
      return state
  }
}

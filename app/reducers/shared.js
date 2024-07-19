import { GET_SHARED_USERS, CLEAR_SHARED_USERS } from '../constants/actionTypes'

const initialState = {
  data: [],
}

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_SHARED_USERS:
      return { ...state, data: action.payload.data }

    case CLEAR_SHARED_USERS:
      return { ...initialState }

    default:
      return state
  }
}

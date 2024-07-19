import {
  GET_USER,
  CLEAR_USER_DATA,
  DELETE_USER,
  EDIT_TEAM_USER,
  CHANGE_USER_DATA,
  SET_THEME_MODE,
} from '../constants/actionTypes'

const initialState = {
  data: {
    name: '',
  },
  theme: 'light',
}

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_USER:
      return { ...state, data: action.payload.data }

    case DELETE_USER: {
      const team = [...state.data.team]
      const index = team.findIndex(({ id }) => id === action.payload.id)
      team.splice(index, 1)
      return { ...state, data: { ...state.data, team } }
    }

    case EDIT_TEAM_USER: {
      const { name } = action.payload.body
      const editedTeam = [...state.data.team].map(user =>
        user.id === action.payload.id
          ? {
              ...user,
              name,
              username: name,
            }
          : user,
      )
      return { ...state, data: { ...state.data, team: editedTeam } }
    }

    case CHANGE_USER_DATA:
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload.data,
          team: state.data.team.map(user => (user.id === state.data.id ? action.payload.data : user)),
        },
      }

    case CLEAR_USER_DATA:
      return { ...initialState }

    case SET_THEME_MODE:
      return {
        ...state,
        theme: action.payload,
      }

    default:
      return state
  }
}

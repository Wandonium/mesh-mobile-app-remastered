import {
  GET_NETWORKS,
  SAVE_NETWORK,
  EDIT_NETWORK,
  DELETE_NETWORK,
  NETWORK_SHARED,
  NETWORK_UNSHARED,
  EDIT_NODE,
  ADD_NODE,
  DELETE_NODE,
  SAVE_PREV_NETWORK,
  GET_NETWORK_HISTORY,
  GET_NETWORK_STATISTIC,
  CLEAR_NETWORK_DATA,
  SELECT_TIME_RANGE,
} from '../constants/actionTypes'

const initialState = {
  data: {
    items: [],
    total_count: 0,
    custom_parameters: {
      total_count_ap: 0,
      total_count_client: 0,
    },
  },
  entities: [],
  networks: [],
  nodes: [],
  result: [],
  networkStatistic: {
    chart: [],
    chartData: [],
    allData: [],
    overviewCapacity: [],
    overviewThroughput: [],
  },
  selectedPeriod: 0,
  interval: 300,
  networkHistory: null,
  prevNetworkNode: {},
}

class APSActions {
  newState = (state, items) => ({
    ...state,
    // data: { ...state.data, ...this.updateTotalInfo(state.data, items), items },
    networks: items,
  })

  updateNetwork = (item, items) => {
    return [...items].map((network) => {
      console.log('[networks.js] - APSActions updateNetwork', network)
    })
  }

  updateTotalInfo = (data, items) => ({
    total_count: items.length,
    custom_parameters: {
      ...data.custom_parameters,
      total_count_ap: items.length ? items.map((n) => n.total_ap).reduce((prev, next) => prev + next) : 0,
      total_count_client: items.length ? items.map((n) => n.clients).reduce((prev, next) => prev + next) : 0,
    },
  })

  newItems = (items, data, action) =>
    [...items].map((network) => (network.id === data.network_id ? this[action](network, data) : network))

  deleteNode = (items, data) => {
    return [...items].map((network) => {
      const newNetwork = this.delete(network, data)
      return newNetwork
    })
  }

  editNode = (items, data) =>
    [...items].map((network) => {
      return network.id === data.network_id ? this.delete(network, data) : network
      // return network.id === data.network_id ? this.add(newNetwork, data) : newNetwork
    })

  add = (network, data) => ({
    ...network,
    aps: [...network.aps, data],
  })

  delete = (network, data) => ({
    ...network,
    aps: network.aps.filter((item) => item.id !== data.id),
  })

}

const apsActions = new APSActions()

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_NETWORKS:
      console.log('[networks.js] - GET_NETWORKS')
      return apsActions.newState(state, action.payload)

    case GET_NETWORK_STATISTIC:
    console.log('[networks.js] - GET_NETWORK_STATISTIC')
      return { ...state, networkStatistic: action.payload.data }

    case GET_NETWORK_HISTORY:
    console.log('[networks.js] - GET_NETWORK_HISTORY')
      return { ...state, networkHistory: action.payload.data }

    case SAVE_NETWORK: {
      console.log('[networks.js] - SAVE_NETWORK')
      const index = state.networks.findIndex((item) => item.id === action.payload.data.id)
      const newItem =
        index !== -1
          ? state.networks.map((item) =>
              item.id === action.payload.data.id ? { ...item, ...action.payload.data } : item,
            )
          : [...state.networks, { ...action.payload.data, aps: [] }]

      return apsActions.newState({ ...state, prevNetworkNode: {} }, newItem)
    }

    case EDIT_NETWORK: {
      console.log('[networks.js] - EDIT_NETWORK')
      const updatedState = state.networks.map((item) =>
        item.id === action.payload.data.id ? { ...item, ...action.payload.data } : item,
      )
      return apsActions.newState(state, updatedState)
    }

    case DELETE_NETWORK:
      console.log('[networks.js] - DELETE_NETWORK')
      return apsActions.newState(
        state,
        state.networks.filter((item) => action.payload.data.id !== item.id),
      )

    case NETWORK_SHARED: {
      console.log('[networks.js] - NETWORK_SHARED')
      const itemIndex = state.networks.findIndex((item) => item.id === action.payload.data.id)
      const newItems =
        itemIndex !== -1
          ? state.networks.map((item) =>
              item.id === action.payload.data.id ? { ...item, ...action.payload.data } : item,
            )
          : [...state.networks, { ...action.payload.data, aps: [] }]

      return apsActions.newState(state, newItems)
    }

    case NETWORK_UNSHARED:
      console.log('[networks.js] - NETWORK_UNSHARED')
      return apsActions.newState(
        state,
        state.networks.filter((item) => action.payload.data.network !== item.id),
      )

    case ADD_NODE:
      console.log('[networks.js] - ADD_NODE')
      return apsActions.newState(state, apsActions.newItems(state.networks, action.payload.data, 'add'))

    case EDIT_NODE:
      console.log('[networks.js] - EDIT_NODE')
      return apsActions.newState(state, apsActions.editNode(state.networks, action.payload.data))

    case DELETE_NODE:
      console.log('[networks.js] - DELETE_NODE')
      return apsActions.newState(state, apsActions.deleteNode(state.networks, action.payload.data, 'delete'))

    case SAVE_PREV_NETWORK:
      console.log('[networks.js] - SAVE_PREV_NETWORK')
      return { ...state, prevNetworkNode: { ...state.prevNetworkNode, ...action.payload.data } }

    case CLEAR_NETWORK_DATA:
      console.log('[networks.js] - CLEAR_NETWORK_DATA')
      return { ...initialState }

    case SELECT_TIME_RANGE:
      console.log('[networks.js] - SELECT_TIME_RANGE')
      return {
        ...state,
        ...action.payload,
      }
    default:
      return state
  }
}

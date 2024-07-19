import AsyncStorage from '@react-native-async-storage/async-storage'
import { applyMiddleware, compose, createStore } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import thunk from 'redux-thunk'
import reducer from '../reducers'

const persistConfig = {
  key: 'root_137',
  // debug: true,
  version: 1,
  storage: AsyncStorage,
}

const persistedReducer = persistReducer(persistConfig, reducer)
const store = createStore(persistedReducer, compose(applyMiddleware(thunk)))
export const persistor = persistStore(store)

export default store // createStore(reducer, applyMiddleware(thunk))

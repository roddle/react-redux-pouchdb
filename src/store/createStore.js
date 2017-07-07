import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import { browserHistory } from 'react-router'
import makeRootReducer from './reducers'
import { updateLocation } from './location'
import { persistentStore } from '@abhinavzspace/redux-pouchdb-plus'
import PouchDB from 'pouchdb'
// for debugging with PouchDB development tools
window.PouchDB = PouchDB

export default (initialState = {}) => {

  // Set up the PouchDB remote, local, and sync the two
  //const remotedb = new PouchDB('http://54.237.198.160:5984/counter');
  const remotedb = new PouchDB('http://192.168.1.246:5984/counter')
  const db = new PouchDB('counter')
  
  db.replicate.from(remotedb)

  db.sync(remotedb, {
    live: true,
    retry: true
  })

  // ======================================================
  // Middleware Configuration
  // ======================================================
  const middleware = [thunk]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = [
    // set the store to persist to the local PouchDB
    persistentStore({db})
  ]

  let composeEnhancers = compose

  if (__DEV__) {
    const composeWithDevToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    if (typeof composeWithDevToolsExtension === 'function') {
      composeEnhancers = composeWithDevToolsExtension
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    composeEnhancers(
      applyMiddleware(...middleware),
      ...enhancers
    )
  )
  store.asyncReducers = {}

  // To unsubscribe, invoke `store.unsubscribeHistory()` anytime
  store.unsubscribeHistory = browserHistory.listen(updateLocation(store))

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  return store
}

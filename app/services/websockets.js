import ReconnectingWebSocket from 'reconnecting-websocket'
import api from '../config/api'
import AlertHelper from './AlertHelper'

const getWebSocketPaths = {
  networkStats: (companyId, userId) => `mobile/companies/${companyId}/users/${userId}`,
  network: (companyId, userId) => `mobile/companies/${companyId}/users/${userId}/networks`,
  node: (companyId, userId) => `mobile/companies/${companyId}/users/${userId}/network/access-points`,
  alerts: (companyId, userId) => `companies/${companyId}/users/${userId}/alerts`,
  sharedNetworks: (userId) => `shared-networks/${userId}`,
  sharedMembers: (companyId) => `companies/${companyId}/shared-networks`,
}

const options = {
  connectionTimeout: 5000,
}

const connectToSocket = (path, token, cb) => {
  const socket = new ReconnectingWebSocket(`${api.ws_path}/${path}?access_token=${token}`, ['wamp'], options)

  socket.onopen = () => {
    socket.send(`[5,"${path}"]`)
    if (this.err) {
      AlertHelper.alert('info', 'Info', 'Connection successfully restored.')
      this.err = false
    }
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)[2]

    let msg = null
    try {
      if (typeof data === 'object') {
        try {
          msg = JSON.parse(data.msg)
          if (!/has left/i.test(msg)) {
            // console.info('Connect to socket', msg)
            cb(msg)
          }
          cb(msg)
        } catch (e) {
          console.log('socket on message', e)
        }
      }
    } catch (e) {
      console.log('Connect to socket error', e)
    }
  }

  socket.onclose = (event) => {
    if (event.wasClean) {
      console.log(`Connection closed cleanly ${path}`)
    } else {
      console.log('Connection closed unexpectedly')
    }
    console.log(`Code: ${event.code} reason: ${event.reason}`)
  }

  socket.onerror = (error) => {
    if (!this.err && socket.retryCount > 2) {
      AlertHelper.alert('error', 'Error', 'Connection to the server is lost or not stable. We are trying to reconnect.')
      this.err = true
    }
    console.log(`Error ${error.message}`)
  }

  return socket
}

export default { getWebSocketPaths, connectToSocket }

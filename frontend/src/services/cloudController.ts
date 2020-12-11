import io from 'socket.io-client'
import analyticsHelper from '../helpers/analyticsHelper'
import { EventEmitter } from 'events'
import { getToken } from '../services/remote.it'
import { store } from '../store'

function encode(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

class CloudController extends EventEmitter {
  async init() {
    console.log('CLOUD CONTROLLER INIT')

    const token = await getToken()
    console.log('BEARER TOKEN', token)

    let socket = new WebSocket('wss://ws.remote.it/beta')

    socket.onopen = event => {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!! SOCKET OPEN', event)
      socket.send(
        JSON.stringify({
          action: 'subscribe',
          headers: { authorization: token },
          query: `
          {
            event {
              type
              timestamp
              target {
                id
                name
              }
              state
            }
          }`,
          // "variables": {}
        })
      )
    }

    socket.onmessage = event => {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!! SOCKET MESSAGE', JSON.parse(event.data))
    }

    // const send = (payload) => {

    //   socket.send()
    // }

    // socket.on('connect', (result: any) => {
    //   console.log('connect', result)
    // })
    // socket.on('DEVICE_STATE', (result: any) => {
    //   console.log('DEVICE_STATE', result)
    // })
    // socket.on('DEVICE_CONNECT', (result: any) => {
    //   console.log('DEVICE_CONNECT', result)
    // })
    // socket.on('DEVICE_SHARE', (result: any) => {
    //   console.log('DEVICE_SHARE', result)
    // })
  }

  // on(eventName: SocketEvent, handler: (...args: any[]) => void) {
  //   socket?.on(eventName, handler)
  //   return this
  // }

  // off(eventName: SocketEvent) {
  //   socket?.off(eventName)
  //   return this
  // }
}

const cloudController = new CloudController()
export default cloudController
export const emit = cloudController.emit

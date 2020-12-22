import analyticsHelper from '../helpers/analyticsHelper'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { WEBSOCKET_URL, WEBSOCKET_KEEPALIVE_INTERVAL } from '../shared/constants'
import { emit } from './Controller'
import { getToken } from './remote.it'
import { store } from '../store'
import { notify } from './Notifications'
import { selectService } from '../models/devices'
import { connectionName, setConnection } from '../helpers/connectionHelper'

function encode(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

class CloudController {
  socket?: ReconnectingWebSocket
  token?: string

  init() {
    this.connect()
    window.setInterval(this.keepAlive, WEBSOCKET_KEEPALIVE_INTERVAL)
  }

  connect() {
    this.socket = new ReconnectingWebSocket(WEBSOCKET_URL)
    this.socket.addEventListener('open', this.onOpen)
    this.socket.addEventListener('message', this.onMessage)
    this.socket.addEventListener('close', e => console.log('CLOUD WS closed', e))
    this.socket.addEventListener('error', e => console.warn('CLOUD WS error', e))
  }

  close() {
    this.socket?.close()
  }

  onOpen = event => {
    console.log('\n-------------------------> SOCKET OPEN\n\n')
    console.log('CLOUD WS opened', event)
    this.authenticate()
  }

  onMessage = response => {
    let event = this.parse(response)
    if (!event) return
    event = this.update(event)
    notify(event)
    console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data, event)
    // {"data":{"event":{"type":"DEVICE_STATE","state":"active","timestamp":"2020-12-16T00:24:56.000Z","target":[{"id":"80:00:00:00:01:07:C2:36","name":"remoteit admin"}]}}}
    // {"data":{"event":{"type":"DEVICE_STATE","state":"inactive","timestamp":"2020-12-16T00:24:46.000Z","target":[{"id":"80:00:00:00:01:07:C2:3E","name":"chat04"}]}}}
    const offline = {
      data: {
        event: {
          type: 'DEVICE_STATE',
          state: 'inactive',
          timestamp: '2020-12-20T18:08:27.000Z',
          target: [{ id: '80:00:00:00:01:09:51:0C', name: 'remoteit admin', application: 42 }],
        },
      },
    }
    const connect = {
      data: {
        event: {
          type: 'DEVICE_CONNECT',
          state: 'connected',
          timestamp: '2020-12-20T18:09:07.000Z',
          target: [{ id: '80:00:00:00:01:09:2F:69', name: 'smb', application: 34 }],
        },
      },
    }
  }

  authenticate = async () => {
    this.socket?.send(
      JSON.stringify({
        action: 'subscribe',
        headers: { authorization: await getToken() },
        query: `
        {
          event {
            type
            state
            timestamp
            target {
              id
              name
              application
            }
          }
        }`,
        // actor {
        //   email
        // }
        // users {
        //   email
        // }
        // "variables": {}
      })
    )
  }

  keepAlive() {
    console.log('CLOUD WS keep alive ping', { readyState: this.socket?.readyState, socket: this.socket })
    this.socket?.send('ping')
  }

  parse(response): ICloudEvent | undefined {
    const state = store.getState()
    let event
    try {
      event = JSON.parse(response.data).data.event
      return {
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        target: event.target.map(t => {
          const [service, device] = selectService(state, t.id)
          return {
            id: t.id,
            name: connectionName(service, device) || t.name,
            typeID: t.application,
            connection: state.backend.connections.find(c => c.id === t.id),
            service,
            device,
          }
        }),
      }
    } catch (error) {
      console.warn('Event parsing error', { event, error })
    }
  }

  update(event: ICloudEvent) {
    const { accounts } = store.dispatch

    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const state = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          if (target.device?.id === target.id) {
            target.device.state = state
            console.log('DEVICE STATE', target.device.name, target.device.state)
          } else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                service.state = state
                console.log('SERVICE STATE', service.name, service.state)
              }
            })
          }
          if (target.device?.id) {
            accounts.setDevice({ id: target.device.id, device: target.device })
          }
        })
        break

      case 'DEVICE_CONNECT':
        // connected | disconnected
        event.target.forEach(target => {
          if (target.connection) {
            target.connection.active = event.state === 'connected'
            target.connection.connecting = false
            setConnection(target.connection)
          }
          console.log('CONNECTION STATE', target.connection?.name, target.connection?.active)
        })
        break

      case 'DEVICE_SHARE':
      // @TODO parse and display notice
    }
    return event
  }
}

const cloudController = new CloudController()
export default cloudController

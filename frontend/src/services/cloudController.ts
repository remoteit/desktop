import analyticsHelper from '../helpers/analyticsHelper'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { WEBSOCKET_URL, WEBSOCKET_KEEPALIVE_INTERVAL } from '../shared/constants'
import { getToken } from './remote.it'
import { store } from '../store'
import { notify } from './Notifications'
import { selectService } from '../models/devices'
import { connectionName, setConnection } from '../helpers/connectionHelper'
import { graphQLGetErrors } from './graphQL'

class CloudController {
  socket?: ReconnectingWebSocket
  token?: string

  init() {
    this.connect()
    // window.setInterval(this.keepAlive, WEBSOCKET_KEEPALIVE_INTERVAL)
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

  // keepAlive() {
  //   console.log('CLOUD WS keep alive ping', { readyState: this.socket?.readyState, socket: this.socket })
  //   this.socket?.send('ping')
  // }

  onOpen = event => {
    console.log('\n-------------------------> SOCKET OPEN\n\n')
    console.log('CLOUD WS opened', event)
    this.authenticate()
    // const unshare = {
    //   data: {
    //     event: {
    //       type: 'DEVICE_SHARE',
    //       state: null,
    //       timestamp: '2020-12-24T00:47:47.000Z',
    //       target: [
    //         {
    //           id: '80:00:00:00:01:09:62:19',
    //           name: 'ubuntu vm',
    //           application: 35,
    //           platform: 1120,
    //           owner: { id: 'E62083B2-91D8-4113-8778-3C77BFDCA1F7', email: 'jamieruderman@gmail.com' },
    //         },
    //       ],
    //       actor: { id: 'E62083B2-91D8-4113-8778-3C77BFDCA1F7', email: 'jamieruderman@gmail.com' },
    //       users: [{ id: 'C3DEBA49-1019-4571-AA34-4F2D58B69A7F', email: 'jamie@remote.it' }],
    //       scripting: false,
    //     },
    //   },
    // }
    // const share = {
    //   data: {
    //     event: {
    //       type: 'DEVICE_SHARE',
    //       state: null,
    //       timestamp: '2020-12-24T00:44:15.000Z',
    //       actor: { id: 'E62083B2-91D8-4113-8778-3C77BFDCA1F7', email: 'jamieruderman@gmail.com' },
    //       users: [{ id: 'C3DEBA49-1019-4571-AA34-4F2D58B69A7F', email: 'jamie@remote.it' }],
    //       target: [
    //         {
    //           id: '80:00:00:00:01:09:62:19',
    //           name: 'ubuntu vm',
    //           application: 35,
    //           platform: 1120,
    //           owner: { id: 'E62083B2-91D8-4113-8778-3C77BFDCA1F7', email: 'jamieruderman@gmail.com' },
    //         },
    //         {
    //           id: '80:00:00:00:01:09:62:1B',
    //           name: 'remoteit admin',
    //           application: 42,
    //           platform: 1120,
    //           owner: { id: 'E62083B2-91D8-4113-8778-3C77BFDCA1F7', email: 'jamieruderman@gmail.com' },
    //         },
    //       ],
    //     },
    //   },
    // }
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
              platform
              owner {
                id
                email
              }
            }
            actor {
              id
              email
            }
            ... on DeviceConnectEvent {
              platform
            }
            ... on DeviceShareEvent {
              scripting
            }
          }
        }`,
        // "variables": {}
      })
    )
  }

  onMessage = response => {
    console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data)
    let event = this.parse(response)
    console.log('EVENT', event)
    if (!event) return
    event = this.update(event)
    notify(event)
  }

  errors(data) {
    const errors = graphQLGetErrors({ data })
    return !!errors?.length
  }

  parse(response): ICloudEvent | undefined {
    const state = store.getState()
    try {
      const json = JSON.parse(response.data)
      if (this.errors(json)) return
      let event = json.data.event
      return {
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        actor: event.actor,
        users: event.users,
        authUserId: state.auth.user?.id || '',
        platform: event.platform,
        target: event.target.map(t => {
          const [service, device] = selectService(state, t.id)
          return {
            id: t.id,
            name: connectionName(service, device) || t.name,
            owner: t.owner,
            typeID: t.application,
            targetPlatform: t.platform,
            connection: state.backend.connections.find(c => c.id === t.id),
            service,
            device,
          }
        }),
      }
    } catch (error) {
      console.warn('Event parsing error', response, error)
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
        const isYou = event.authUserId === event.actor.id
        event.target.forEach(target => {
          // You have changed connection state
          if (isYou && target.connection) {
            target.connection.active = event.state === 'connected'
            target.connection.connecting = false
            setConnection(target.connection)
          }

          // connection state for other users
          else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                const i = service.sessions.findIndex(s => s.id === event.actor.id)
                if (i) service.sessions.splice(i, 1)
                service.sessions.push({
                  id: event.actor.id,
                  timestamp: event.timestamp,
                  email: event.actor.email,
                  platform: event.platform,
                })
              }
            })
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

import ReconnectingWebSocket from 'reconnecting-websocket'
import { getToken } from './remote.it'
import { AxiosResponse } from 'axios'
import { getWebSocketURL } from '../helpers/apiHelper'
import { version } from '../../package.json'
import { store } from '../store'
import { notify } from './Notifications'
import { selectById } from '../models/devices'
import { combinedName } from '../shared/nameHelper'
import { setConnection, findLocalConnection } from '../helpers/connectionHelper'
import { graphQLGetErrors } from './graphQL'
import { emit } from './Controller'
import { agent } from '../services/Browser'

class CloudController {
  socket?: ReconnectingWebSocket
  token?: string

  init() {
    this.connect()
  }

  connect() {
    if (this.socket instanceof ReconnectingWebSocket) return
    this.socket = new ReconnectingWebSocket(getWebSocketURL())
    this.socket.addEventListener('open', this.onOpen)
    this.socket.addEventListener('message', this.onMessage)
    this.socket.addEventListener('close', e => console.log('CLOUD WS closed', e))
    this.socket.addEventListener('error', e => console.warn('CLOUD WS error', e))
    window.addEventListener('online', this.checkOffline)
    window.addEventListener('offline', this.checkOffline)
  }

  checkOffline = () => {
    if (navigator.onLine) this.socket?.reconnect()
    else this.close()
  }

  close() {
    this.socket?.close()
  }

  onOpen = event => {
    console.log('\n-------------------------> SOCKET OPEN\n\n')
    console.log('CLOUD WS opened', event)
    this.authenticate()
  }

  authenticate = async () => {
    const message = JSON.stringify({
      action: 'subscribe',
      headers: { authorization: await getToken(), 'User-Agent': `remoteit/${version} ${agent()}` },
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
            device {
              id
              name
            }
          }
          actor {
            id
            email
          }
          ... on DeviceConnectEvent {
            platform
            session
            proxy
            sourceGeo {
              city
              stateName
              countryName
            }
  
          }
          ... on DeviceShareEvent {
            scripting
          }
          ... on LicenseUpdatedEvent {
            plan {
              name
              product {
                name
              }
            }
            quantity
            expiration
          }
        }
      }`,
    })
    this.socket?.send(message)
  }

  onMessage = response => {
    console.log('\n-------------------------> SOCKET MESSAGE\n\n', response.data)
    let event = this.parse(response)
    console.log('EVENT', event)
    if (!event) return
    event = this.update(event)
    notify(event)
    emit('heartbeat')
  }

  errors(data) {
    const errors = graphQLGetErrors({ data } as AxiosResponse, true)
    return !!errors?.length
  }

  parse(response): ICloudEvent | undefined {
    const state = store.getState()
    try {
      const json = JSON.parse(response.data)
      if (this.errors(json)) {
        return
      }
      let event = json.data.event
      return {
        type: event.type,
        state: event.state,
        timestamp: new Date(event.timestamp),
        isP2P: !event.proxy,
        actor: event.actor,
        users: event.users,
        authUserId: state.auth.user?.id || '',
        platform: event.platform,
        sessionId: event.session,
        geo: event.sourceGeo,
        metadata: state.auth.notificationSettings,
        quantity: event.quantity,
        expiration: event.expiration && new Date(event.expiration),
        plan: event.plan,
        target: event.target.map(t => {
          const [service, device] = selectById(state, t.id)
          const connection = findLocalConnection(state, t.id, event.session)
          return {
            id: t.id,
            name: combinedName(t, t.device),
            owner: t.owner,
            typeID: t.application,
            platform: t.platform,
            deviceId: t.device.id,
            connection,
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
    const { accounts, sessions, licensing } = store.dispatch

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
                return true
              }
              return false
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
          // Local connection state
          if (target.connection) {
            if (target.connection.public) {
              target.connection.enabled = event.state === 'connected'
              if (event.state !== 'connected') target.connection.endTime = Date.now()
            }
            target.connection.connected = event.state === 'connected'
            target.connection.connecting = false
            setConnection(target.connection)
          }

          // session state
          if (event.state === 'connected') {
            sessions.setSession({
              id: event.sessionId,
              timestamp: event.timestamp,
              platform: event.platform,
              isP2P: event.isP2P,
              user: event.actor,
              geo: event.geo,
              public: !!target.connection?.public,
              target: {
                id: target.id,
                deviceId: target.deviceId,
                platform: target.platform,
                name: target.name,
              },
            })
          } else {
            sessions.removeSession(event.sessionId)
          }
          if (target.device?.id) {
            accounts.setDevice({ id: target.device.id, device: target.device })
          }

          console.log('CONNECTION STATE', target.connection?.name, target.connection?.connected)
        })
        break

      case 'DEVICE_SHARE':
        // @TODO parse and display notice
        break

      case 'LICENSE_UPDATED':
        console.log('LICENSE UPDATED EVENT', event)
        licensing.updated()
        break
    }
    return event
  }
}

const cloudController = new CloudController()
export default cloudController

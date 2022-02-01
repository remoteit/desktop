import ReconnectingWebSocket from 'reconnecting-websocket'
import network from '../services/Network'
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
import { agent } from '../services/Browser'
import { emit } from './Controller'

class CloudController {
  socket?: ReconnectingWebSocket
  token?: string
  pingInterval = 5 * 60 * 1000 // 5 minutes
  timer?: NodeJS.Timeout

  init() {
    this.connect()
    network.on('connect', this.reconnect)
    this.timer = setTimeout(this.ping, this.pingInterval)
  }

  log(...args) {
    console.log(`%c${args[0]}`, 'color:cyan;font-weight:bold', ...args.slice(1))
  }

  connect() {
    if (this.socket instanceof ReconnectingWebSocket) return
    this.socket = new ReconnectingWebSocket(getWebSocketURL())
    this.socket.addEventListener('open', this.onOpen)
    this.socket.addEventListener('message', this.onMessage)
    this.socket.addEventListener('close', e => this.log('CLOSED CLOUD SOCKET', e))
    this.socket.addEventListener('error', e => this.log('ERROR CLOUD SOCKET', e))
  }

  ping = () => {
    this.log('PING CLOUD SOCKET')
    this.socket?.send('ping')
  }

  reconnect = () => {
    if (store.getState().auth.authenticated) {
      this.log('ONLINE - RECONNECT CLOUD SOCKET')
      this.socket?.reconnect()
    }
  }

  close() {
    this.log('CLOSE CLOUD SOCKET')
    this.socket?.close()
  }

  onOpen = event => {
    this.log('OPENED CLOUD SOCKET', event)
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
    this.log('\nCLOUD SOCKET MESSAGE\n\n', response.data)
    let event = this.parse(response)
    this.log('EVENT', event)
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
    if (response.data === 'pong') return

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
    const { accounts, sessions, licensing, ui, devices } = store.dispatch

    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const state = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          // if device and device exists
          if (target.device?.id === target.id) {
            target.device.state = state
            this.log('DEVICE STATE', target.device.name, target.device.state)

            // if service and service exists
          } else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                service.state = state
                this.log('SERVICE STATE', service.name, service.state)
                return true
              }
              return false
            })
          }

          // if device exists
          if (target.device?.id) {
            accounts.setDevice({ id: target.device.id, device: target.device })
          }

          // if new unknown device discovered
          if (!target.device && target.id === target.deviceId && state === 'active') {
            if (store.getState().devices.registrationCommand) {
              ui.set({
                redirect: `/devices/${target.deviceId}`,
                successMessage: `${target.name} registered successfully!`,
              })
              devices.fetch()
            }
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

          this.log('CONNECTION STATE', target.connection?.name, target.connection?.connected)
        })
        break

      case 'DEVICE_SHARE':
        // @TODO parse and display notice
        break

      case 'LICENSE_UPDATED':
        this.log('LICENSE UPDATED EVENT', event)
        licensing.updated()
        break
    }
    return event
  }
}

const cloudController = new CloudController()
export default cloudController

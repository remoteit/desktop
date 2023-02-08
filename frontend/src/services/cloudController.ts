import ReconnectingWebSocket from 'reconnecting-websocket'
import network from '../services/Network'
import { DEVICE_TYPE } from '../shared/applications'
import { getToken } from './remote.it'
import { AxiosResponse } from 'axios'
import { getWebSocketURL, getTestHeader } from '../helpers/apiHelper'
import { getAccountIds } from '../models/accounts'
import { version } from '../helpers/versionHelper'
import { store } from '../store'
import { notify } from './Notifications'
import { selectById } from '../selectors/devices'
import { combinedName } from '../shared/nameHelper'
import { setConnection, findLocalConnection } from '../helpers/connectionHelper'
import { getActiveAccountId } from '../selectors/accounts'
import { graphQLGetErrors } from './graphQL'
import { agent } from '../services/Browser'
import { emit } from './Controller'

class CloudController {
  initialized: boolean = false
  socket?: ReconnectingWebSocket
  token?: string
  pingInterval = 5 * 60 * 1000 + Math.floor(Math.random() * 5 * 60 * 1000) // 5 + random 5 minutes
  timer?: NodeJS.Timeout

  init() {
    if (this.initialized) {
      console.warn('CLOUD CONTROLLER ALREADY INITIALIZED')
      return
    }
    this.connect()
    network.on('connect', this.reconnect)
    network.on('disconnect', this.close)
    this.startPing()
    this.initialized = true
  }

  log(...args) {
    console.log(`%c${args[0]}`, 'color:blue;font-weight:bold', ...args.slice(1))
  }

  connect() {
    if (this.socket instanceof ReconnectingWebSocket) {
      this.log('CLOUD SOCKET ALREADY CONNECTED')
      return
    }

    const url = getWebSocketURL()

    if (!navigator.onLine || !url) return

    this.log('CONNECT CLOUD SOCKET', url, this.socket)
    if (url) {
      this.socket = new ReconnectingWebSocket(url, [], {})
      this.socket.addEventListener('open', this.onOpen)
      this.socket.addEventListener('message', this.onMessage)
      this.socket.addEventListener('close', this.onClose)
      this.socket.addEventListener('error', this.onError)
    }
  }

  startPing() {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(this.ping, this.pingInterval)
  }

  ping = () => {
    this.log('PING CLOUD SOCKET')
    this.socket?.send('ping')
  }

  reconnect = () => {
    if (store.getState().auth.authenticated) {
      this.log('RECONNECT CLOUD SOCKET')
      this.close()
      delete this.socket
      this.connect()
      // re-sync device
      store.dispatch.sessions.fetch()
    }
  }

  close = () => {
    this.log('CLOSE CLOUD SOCKET')
    this.socket?.removeEventListener('open', this.onOpen)
    this.socket?.removeEventListener('message', this.onMessage)
    this.socket?.removeEventListener('close', this.onClose)
    this.socket?.removeEventListener('error', this.onError)
    this.socket?.close()
  }

  onClose = event => this.log('CLOSED CLOUD SOCKET', event)

  onError = error => this.log('ERROR CLOUD SOCKET', error)

  onOpen = event => {
    this.log('OPENED CLOUD SOCKET', event)
    this.authenticate()
  }

  authenticate = async () => {
    const message = JSON.stringify({
      action: 'subscribe',
      headers: {
        authorization: await getToken(),
        'User-Agent': `remoteit/${version} ${agent()}`,
        ...getTestHeader(),
      },
      query: `
      {
        event {
          type
          state
          action
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
              created
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
            users {
              id
              email
            }
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
    this.log('CLOUD SOCKET MESSAGE\n', response.data)
    if (response.data === 'pong') return
    let event = this.parse(response)
    this.log('EVENT', event)
    if (!event) return
    event = this.update(event)
    notify(event)
    this.startPing()
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
        console.error('CLOUD GRAPHQL WS ERROR', json.errors)
        this.log('ERROR', json.errors)
      }
      let event = json.data.event
      return {
        type: event.type,
        state: event.state,
        action: event.action,
        timestamp: new Date(event.timestamp),
        isP2P: !event.proxy,
        actor: event.actor,
        users: event.users,
        authUserId: state.auth.user?.id || '',
        platform: event.platform,
        sessionId: event.session,
        geo: event.sourceGeo,
        quantity: event.quantity,
        expiration: event.expiration && new Date(event.expiration),
        plan: event.plan,
        target: event.target.map(t => {
          const [service, device] = selectById(state, undefined, t.id)
          const connection = findLocalConnection(state, t.id, event.session)
          return {
            id: t.id,
            name: combinedName(t, t.device),
            owner: t.owner,
            typeID: t.application,
            platform: t.platform,
            deviceId: t.device.id,
            deviceCreated: new Date(t.device.created),
            connection: structuredClone(connection),
            service: structuredClone(service),
            device: structuredClone(device),
          }
        }),
      }
    } catch (error) {
      console.warn('Event parsing error', response, error)
    }
  }

  update(event: ICloudEvent) {
    const { accounts, sessions, plans, ui, devices } = store.dispatch

    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const onlineState = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          // if device and device exists
          if (target.device?.id === target.id) {
            target.device.state = onlineState
            this.log('DEVICE STATE', target.device.name, target.device.state)

            // if service and service exists
          } else {
            target.device?.services.find(service => {
              if (service.id === target.service?.id) {
                service.state = onlineState
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

          // New unknown device discovered
          if (!target.device && target.id === target.deviceId && onlineState === 'active') {
            const state = store.getState()

            // Device created within one minute of the event
            if (
              target.owner?.id === getActiveAccountId(state) &&
              event.timestamp.getTime() - target.deviceCreated.getTime() < 1000 * 60
            ) {
              if (state.ui.registrationCommand) ui.set({ redirect: `/devices/${target.deviceId}` })
              ui.set({ successMessage: `${target.name} registered successfully!` })
              devices.fetchSingle({ id: target.deviceId, newDevice: true })
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
              public: !!target.connection?.public, // TODO remove this and query for connection data
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
        // don't handle actions you've done
        if (event.authUserId === event.actor.id) break

        const state = store.getState()
        const accountIds = getAccountIds(state)
        const accountTo = event.users.find(u => accountIds.includes(u.id))

        // device unshared from me or my org
        if (accountTo && event.action === 'remove') {
          event.target.forEach(target => {
            if (target.typeID === DEVICE_TYPE) devices.cleanup(target.id)
          })
        }

        // device shared or updated with me or my org
        else if (accountTo && ['add', 'update'].includes(event.action)) {
          event.target.forEach(target => {
            if (target.typeID === DEVICE_TYPE)
              devices.fetchSingle({ id: target.deviceId, newDevice: event.action === 'add' })
          })
        }

        break

      case 'LICENSE_UPDATED':
        this.log('LICENSE UPDATED EVENT', event)
        setTimeout(plans.updated, 2000) // because event comes in before plan is fully updated
        break
    }
    return event
  }
}

const cloudController = new CloudController()
export default cloudController

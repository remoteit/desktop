import ReconnectingWebSocket from 'reconnecting-websocket'
import structuredClone from '@ungap/structured-clone'
import CloudTimes from './CloudTimes'
import network from '../services/Network'
import { selectJob } from '../selectors/scripting'
import { AxiosResponse } from 'axios'
import { isReverseProxy } from '../models/applicationTypes'
import { getAccountIds, accountFromDevice } from '../models/accounts'
import { getWebSocketURL, getTestHeader } from '../helpers/apiHelper'
import { DEVICE_TYPE } from '@common/applications'
import { getToken } from './remoteit'
import { version } from '../helpers/versionHelper'
import { store } from '../store'
import { notify } from './Notifications'
import { selectById } from '../selectors/devices'
import { combinedName } from '@common/nameHelper'
import {
  setConnection,
  findLocalConnection,
  getManufacturerType,
  getManufacturerUser,
} from '../helpers/connectionHelper'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLGetErrors } from './graphQL'
import { agent } from './browser'
import { emit } from './Controller'

const stateTimes = new CloudTimes()
const connectTimes = new CloudTimes()

class CloudController {
  initialized: boolean = false
  socket?: ReconnectingWebSocket
  token?: string
  pingInterval = 5 * 60 * 1000 + Math.floor(Math.random() * 60 * 1000) // 5 + random 60 seconds
  pongReceived: number = Date.now()
  timer?: NodeJS.Timeout

  init() {
    if (this.initialized) {
      console.warn('CLOUD CONTROLLER ALREADY INITIALIZED')
      return
    }
    this.connect()
    network.on('connect', this.reconnect)
    network.on('disconnect', this.close)
    this.initialized = true
  }

  log(...args) {
    console.log(`%cCLOUD SOCKET ${args[0]}`, 'color:cyan;font-weight:bold', ...args.slice(1))
  }

  connect() {
    if (this.socket instanceof ReconnectingWebSocket) {
      this.log('ALREADY CONNECTED')
      return
    }

    const url = getWebSocketURL()

    if (!navigator.onLine || !url) return

    this.log('CONNECT', url, this.socket)
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
    this.log('START PING', this.pingInterval)
    this.timer = setInterval(this.ping, this.pingInterval)
  }

  ping = () => {
    const timeSincePong = Date.now() - this.pongReceived
    if (timeSincePong > this.pingInterval * 2) {
      this.log('NO PONG RECEIVED')
      this.reconnect()
      return
    }
    this.log('PING')
    this.socket?.send('ping')
  }

  reconnect = () => {
    if (store.getState().auth.authenticated) {
      this.log('RECONNECT')
      this.close()
      this.connect()
    }
  }

  close = () => {
    this.log('CLOSE')
    this.socket?.removeEventListener('open', this.onOpen)
    this.socket?.removeEventListener('message', this.onMessage)
    this.socket?.removeEventListener('close', this.onClose)
    this.socket?.removeEventListener('error', this.onError)
    this.socket?.close()
    delete this.socket
  }

  onClose = event => this.log('CLOSED', event)

  onError = error => this.log('ERROR', error)

  onOpen = event => {
    this.log('OPENED', event)
    this.authenticate()
    this.startPing()
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
          ... on DeviceStateEvent {
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
                access {
                  user {
                    id
                  }
                }
              }
            }
          }
          ... on DeviceConnectEvent {
            platform
            session
            source
            proxy
            manufacturer
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
          ... on DeviceTransferEvent {
            users {
              id
              email
            }
          }
          ... on DeviceJobEvent {
            job {
              id
              status
              owner {
                id
              }
            }
            jobDevice {
              id
              status
              device {
                id
              }
            }
          }
          ... on JobEvent {
            job {
              id
              status
              owner {
                id
              }
            }
          }
          ... on LicenseUpdatedEvent {
            owner {
              id
              email
            }
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
    this.log('MESSAGE\n', response.data)

    if (response.data === 'pong') {
      this.pongReceived = Date.now()
      return
    }

    let event = this.parse(response)
    if (!event) return

    this.log('EVENT', event)
    event = this.update(event)
    notify(event)
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
      const reverseProxy = isReverseProxy(state, event.target[0]?.application)
      return {
        reverseProxy,
        type: event.type,
        state: event.state,
        action: event.action,
        timestamp: new Date(event.timestamp).getTime(),
        isP2P: !event.proxy,
        actor: getManufacturerUser(event.manufacturer, reverseProxy) || event.actor,
        users: event.users,
        owner: event.owner,
        authUserId: state.auth.user?.id || '',
        platform: event.platform,
        sessionId: event.session,
        source: event.source,
        geo: event.sourceGeo,
        quantity: event.quantity,
        manufacturer: event.manufacturer,
        manufacturerType: getManufacturerType(event.manufacturer, reverseProxy),
        expiration: event.expiration && new Date(event.expiration),
        plan: event.plan,
        job: {
          ...event.job,
          jobDevice: event.jobDevice,
          target: selectJob(state, event.job?.owner.id, event.job?.id),
        },
        target: event.target.map(t => {
          const [service, device] = selectById(state, undefined, t.id)
          const connection = findLocalConnection(state, t.id, event.session)
          return {
            id: t.id,
            name: combinedName(t, t.device),
            owner: t.owner,
            accountId: accountFromDevice(state, t.owner?.id, t.device?.access?.map(a => a.user.id) || []),
            typeID: t.application,
            platform: t.platform,
            deviceId: t.device?.id || device?.id,
            deviceCreated: new Date(t.device?.created),
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
    const dispatch = store.dispatch

    switch (event.type) {
      case 'DEVICE_STATE':
        // active | inactive
        const onlineState = event.state === 'active' ? 'active' : 'inactive'
        event.target.forEach(target => {
          if (stateTimes.outdated(event.timestamp, target.id)) return

          // if device exists and is the target
          if (target.device && target.device.id === target.id) {
            target.device.state = onlineState
            target.device[onlineState === 'active' ? 'onlineSince' : 'offlineSince'] = event.timestamp
          } else {
            // if service exists and is the target
            target.device?.services.forEach(service => {
              if (service.id === target.service?.id) {
                service.state = onlineState
              }
            })
          }

          // Update connection state
          if (target.connection) {
            target.connection.online = onlineState === 'active'
            setConnection(target.connection)
          }

          // if device exists
          if (target.device?.id) {
            dispatch.accounts.setDevice({ id: target.device.id, device: target.device, accountId: target.accountId })
            dispatch.devices.sortByState(target.accountId)
          }

          // New unknown device discovered
          if (!target.device && target.id === target.deviceId && onlineState === 'active') {
            const state = store.getState()

            // Device created within one minute of the event
            if (
              target.owner?.id === selectActiveAccountId(state) &&
              event.timestamp - target.deviceCreated.getTime() < 1000 * 60
            ) {
              if (state.ui.registrationCommand) dispatch.ui.set({ redirect: `/devices/${target.deviceId}` })
              dispatch.ui.set({ successMessage: `${target.name} registered successfully!` })
              dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: true })
            }
          }
        })
        break

      case 'DEVICE_CONNECT':
        // connected | disconnected
        emit('heartbeat') // sync with backend
        event.target.forEach(target => {
          if (connectTimes.outdated(event.timestamp, target.id)) return

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
            dispatch.sessions.setSession({
              id: event.sessionId,
              manufacturer: event.manufacturerType,
              reverseProxy: event.reverseProxy,
              timestamp: new Date(event.timestamp),
              source: event.source,
              platform: event.platform,
              isP2P: event.isP2P,
              user: event.actor,
              geo: event.geo,
              target: {
                id: target.id,
                accountId: target.accountId,
                deviceId: target.deviceId,
                platform: target.platform,
                name: target.name,
              },
            })
          } else {
            dispatch.sessions.removeSession(event.sessionId)
          }
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
            if (target.typeID === DEVICE_TYPE) dispatch.devices.cleanup([target.id])
          })
        }

        // device shared or updated with me or my org
        else if (accountTo && ['add', 'update'].includes(event.action)) {
          event.target.forEach(target => {
            if (target.typeID === DEVICE_TYPE)
              dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: event.action === 'add' })
          })
        }
        break

      case 'JOB':
      case 'DEVICE_JOB':
        if (!event.job) break
        console.log('JOB EVENT', event.job)

        if (!event.job.target) {
          const state = store.getState()
          if (!state.jobs.fetching) dispatch.jobs.fetchSingle({ accountId: event.job.owner.id, jobId: event.job.id })
          break
        }

        const jobDevice = event.job.jobDevice
        const jobDevices = event.job.target.jobDevices

        dispatch.jobs.setJobs({
          accountId: event.job.owner.id,
          jobs: [
            {
              ...event.job.target,
              status: event.job.status,
              jobDevices: jobDevice
                ? jobDevices.map(jd =>
                  jd.device.id === jobDevice.device.id ? { ...jd, status: jobDevice.status } : jd
                )
                : jobDevices,
            },
          ],
        })

        if (event.type === 'JOB' && event.job?.status === 'SUCCESS') {
          dispatch.jobs.fetchSingle({ accountId: event.job.owner.id, jobId: event.job.id })
        }

        break

      case 'DEVICE_REFRESH':
        let accountId = ''
        const refreshIds = event.target.reduce((result: string[], target) => {
          // Check that it's the bulk service and that the device is loaded in the ui
          if (target.typeID === DEVICE_TYPE && target.device) result.push(target.deviceId)
          accountId = target.accountId
          return result
        }, [])
        // avoid double loading device if on the device page
        for (const id of refreshIds) {
          if (window.location.href.includes(id)) {
            dispatch.devices.fetchSingleFull({ id, hidden: true, silent: true, accountId })
            refreshIds.splice(refreshIds.indexOf(id), 1)
          }
        }
        // fetch the rest
        if (refreshIds.length) {
          dispatch.devices.fetchDevices({ ids: refreshIds, accountId })
        }
        break

      case 'DEVICE_DELETE':
        const deleteIds = event.target.reduce((result: string[], target) => {
          if (target.device) result.push(target.deviceId)
          return result
        }, [])
        this.log('DEVICE DELETE EVENT', deleteIds, event)
        if (deleteIds.length) dispatch.devices.cleanup(deleteIds)
        break

      case 'DEVICE_TRANSFER':
        event.target.forEach(async target => {
          const newOwnerId = target.owner?.id
          const isReceiving = newOwnerId === event.authUserId

          this.log('DEVICE TRANSFER EVENT', { isReceiving, newOwnerId, authUserId: event.authUserId }, event)

          if (isReceiving) {
            // NEW OWNER: Refresh device list to show transferred device
            dispatch.ui.set({ successMessage: `${target.name} was transferred to you!` })
            dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: true })
          } else {
            // OLD OWNER or ORG MEMBER: Remove from local list
            if (target.device) {
              dispatch.devices.cleanup([target.deviceId])
            }
          }
        })
        break

      case 'LICENSE_UPDATED':
        setTimeout(
          () =>
            dispatch.plans.updated({
              owner: event.owner,
              planName: event.plan?.name,
              quantity: event.quantity,
            }),
          1000 // because event comes in before plan is fully updated
        )
        break
    }
    return event
  }
}

const cloudController = new CloudController()
export default cloudController
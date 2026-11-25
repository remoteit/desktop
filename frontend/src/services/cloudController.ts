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
import { oidcAccessToken, oidcSignIns, oidcSubscribe } from './oidc'
import {
  getSignIns,
  requestSignIn,
  RequestFor,
  selectAccountRoutes,
  selectPersonIds,
  selectPersonSub,
  selectRowOf,
  rowGone,
} from '../selectors/signIns'
import { resourceForEventsURL } from '../constants'
import { version } from '../helpers/versionHelper'
import { store } from '../store'
import { notify } from './Notifications'
import { productFullEventFields } from './productMaxDevices'
import { deviceRows, selectById } from '../selectors/devices'
import { RowKey, rowAccount, rowKey, rowSub } from '../helpers/rowKey'
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

// D11a (permitteer docs/remoteit-desktop-login.md Phase 4c): the events stream is SOMETIMES its own
// audience (resourceForEventsURL says when); otherwise it presents the graphql token — on the
// unified front that is the right audience, not a stand-in, and on the legacy shared-domain URL the
// authorizer's dual-accept window admits it until that contract retires.
// `sub`: the sign-in whose token it is; absent, the page's own person.
export async function wsAuthorization(sub?: string): Promise<string> {
  const resource = resourceForEventsURL(getWebSocketURL() || '')
  if (!resource) return await getToken(sub)
  const token = await oidcAccessToken(resource, sub)
  return token ? 'Bearer ' + token : ''
}

/** wsAuthorization for a socket about one thing (a job's output): as the sign-in that serves the account it is in. */
export const wsAuthorizationFor = (requestFor: RequestFor): Promise<string> =>
  wsAuthorization(requestSignIn(store.getState(), requestFor))

/* Every row's list that holds a device (helpers/rowKey), each with its own copy: a device shared with two people
   signed in here is in both their lists, and one of an organization two of them reach is in its row under each; an
   event about it comes once (it is passed over on the other's socket), so what it says of the device goes into every
   copy. The rows' lists alone: not those kept beside them by other names. */
function copiesOf(state: any, deviceId?: string): [row: RowKey, device: IDevice][] {
  if (!deviceId) return []
  const held = deviceRows(state.devices || {}).flatMap(row => {
    const device = state.devices[row]?.all?.find((d: IDevice) => d.id === deviceId)
    return device ? [[row, device] as [RowKey, IDevice]] : []
  })
  if (!held.length) return held
  const accounts = getAccountIds(state)
  return held.filter(([row]) => accounts.includes(rowAccount(row)))
}

// A row as a model is told it: the account, and the sign-in whose row of it.
const rowOf = (row: RowKey) => ({ accountId: rowAccount(row), sub: rowSub(row) })

/* Every row of an account that a model keeps something for (`byRow`, its lookup) — one for each sign-in here that
   has read it — and the row the account is looked at through, first, kept yet or not. An event is handled once here
   though each sign-in's socket brings it (seenBefore), so what it adds is added to each of the account's rows, read as
   that row's own sign-in: not to the row looked at alone. `quiet` on the rest: a sign-in that may not see what was
   added says nothing of it. */
function rowsOf(state: any, byRow: ILookup<unknown> | undefined, accountId: string) {
  const looked = selectRowOf(state, accountId)
  const rest = (Object.keys(byRow || {}) as RowKey[]).filter(
    row => row !== looked && rowAccount(row) === accountId && !rowGone(state, row)
  )
  return [{ ...rowOf(looked) }, ...rest.map(row => ({ ...rowOf(row), quiet: true }))]
}

// How long an event delivered to one sign-in's socket is remembered, so its copy on another's is passed over.
const SEEN_FOR_MS = 60_000

/* ONE SOCKET PER SIGN-IN. The stream answers a subscribe with the events its token's person may see, so each sign-in
   in use has a socket of its own, subscribed with its own token: the controller the app uses is the page's own
   person's (`sub` ''), and it keeps one more of itself for every sign-in beside them (`others`), opened and closed as
   they join and leave. Every socket's events go through the one pipeline into the same state, kept by account id; an
   event two sign-ins both see (a device shared with both, an organization both belong to) is handled once — so what
   is done with one never rests on whose copy came first: where it matters who "you" are (a share, a transfer, a
   notice), it is everyone signed in here (authUserIds), not the one person whose socket brought it. */
class CloudController {
  initialized: boolean = false
  socket?: ReconnectingWebSocket
  token?: string
  pingInterval = 5 * 60 * 1000 + Math.floor(Math.random() * 60 * 1000) // 5 + random 60 seconds
  pongReceived: number = Date.now()
  timer?: NodeJS.Timeout
  others = new Map<string, CloudController>()
  unfollow?: () => void
  seen = new Map<string, number>()

  constructor(readonly sub: string = '', readonly main?: CloudController) {}

  // Idempotent: connect() is a no-op when the socket is up, so a second signedIn()
  // recovers a closed socket rather than returning early and leaving it dead.
  init() {
    this.followSignIns()
    this.connect()
    if (this.initialized) return
    network.on('connect', this.reconnect)
    network.on('disconnect', this.close)
    this.initialized = true
  }

  /** A socket for each sign-in beside the page's own person, as they are now and as they change. */
  followSignIns = () => {
    if (this.main) return
    this.unfollow ??= oidcSubscribe(this.followSignIns)
    const subs = oidcSignIns()
      .filter(signIn => !signIn.primary)
      .map(signIn => signIn.sub)
    this.others.forEach((other, sub) => {
      if (subs.includes(sub)) return
      other.stop()
      this.others.delete(sub)
    })
    subs.forEach(sub => {
      if (this.others.has(sub)) return
      const other = new CloudController(sub, this)
      this.others.set(sub, other)
      // Opened with the page's own socket: at once when that is up, else by its connect().
      if (this.socket) other.open()
    })
  }

  /** The person this socket's events are seen by: the sign-in's own account. */
  viewerId(state = store.getState()): string {
    return (this.sub && getSignIns(state)[this.sub]?.id) || state.auth.user?.id || ''
  }

  log(...args) {
    console.log(`%cCLOUD SOCKET ${args[0]}`, 'color:cyan;font-weight:bold', ...args.slice(1))
  }

  /** This socket, then each further sign-in's. */
  connect() {
    this.open()
    this.others.forEach(other => other.open())
  }

  open() {
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
    // reset the pong clock so a stale timestamp from a previous connection
    // doesn't make the first ping of this one look unanswered
    this.pongReceived = Date.now()
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
    // The refresh button's ping (the page's own socket) asks every sign-in's.
    this.others.forEach(other => other.socket?.send('ping'))
  }

  reconnect = () => {
    if (store.getState().auth.authenticated) {
      this.log('RECONNECT')
      this.close()
      this.connect()
    }
  }

  close = () => {
    this.others.forEach(other => other.close())
    this.log('CLOSE')
    this.socket?.removeEventListener('open', this.onOpen)
    this.socket?.removeEventListener('message', this.onMessage)
    this.socket?.removeEventListener('close', this.onClose)
    this.socket?.removeEventListener('error', this.onError)
    this.socket?.close()
    delete this.socket
  }

  /**
   * Tear down for sign out. Unlike close(), which only drops the socket and
   * expects a network event to bring it back, this clears initialized and the
   * network listeners so the next signedIn() can init() from scratch.
   */
  reset = () => {
    this.log('RESET')
    this.unfollow?.()
    this.unfollow = undefined
    this.others.forEach(other => other.stop())
    this.others.clear()
    this.seen.clear()
    this.stop()
    network.off('connect', this.reconnect)
    network.off('disconnect', this.close)
    this.initialized = false
  }

  /** This socket and its ping, ended. */
  stop() {
    this.close()
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
  }

  onClose = event => this.log('CLOSED', event)

  onError = error => this.log('ERROR', error)

  onOpen = event => {
    this.log('OPENED', event)
    this.authenticate()
    this.startPing()
  }

  authenticate = async () => {
    // Capture the socket before awaiting the token: signing out mid-flight replaces
    // it, and sending this subscribe on the successor would double up its
    // subscription - every device event would then be processed twice.
    const socket = this.socket
    const message = JSON.stringify({
      action: 'subscribe',
      // Opt in to bulk-frame delivery on the server. The notify Lambda
      // buffers events for ~200ms per connection and ships them in a
      // single `{events: [...]}` frame, instead of one frame per event.
      // This bypasses API Gateway's per-connection serialised send queue
      // (which caps at ~4 msg/sec) and is what makes a 300-device burst
      // land in seconds instead of ~2 minutes. Old clients that omit
      // this flag continue to receive single-event frames.
      supportsBatch: true,
      headers: {
        authorization: await wsAuthorization(this.sub || undefined),
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
${await productFullEventFields()}
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
    if (socket !== this.socket) {
      this.log('STALE AUTHENTICATE - SOCKET REPLACED')
      return
    }
    socket?.send(message)
  }

  onMessage = response => {
    this.log('MESSAGE\n', response.data)

    if (response.data === 'pong') {
      this.pongReceived = Date.now()
      return
    }

    // The server may bundle several GraphQL subscription results into a
    // single WS frame as `{events: [<payload>, <payload>, ...]}` when the
    // connection opted in via `supportsBatch: true` at subscribe time.
    // Decode once and dispatch each contained payload through the same
    // per-event pipeline as a legacy single-frame message — flattened
    // here so the rest of the app never sees the bulk envelope.
    let raw: any
    try {
      raw = JSON.parse(response.data)
    } catch (error) {
      console.warn('Event parsing error', response, error)
      return
    }

    if (raw && Array.isArray(raw.events)) {
      for (const payload of raw.events) {
        this.handleParsed(payload)
      }
      return
    }

    this.handleParsed(raw)
  }

  // Per-event handler shared by the legacy (single-frame) and bulk-frame
  // delivery paths. Accepts an already-parsed GraphQL response object
  // (`{data: {event: {...}}}` or `{errors: [...]}`); converting from the
  // raw WS string lives in `onMessage`.
  handleParsed = (payload: any) => {
    const main = this.main ?? this
    if (main.others.size && main.seenBefore(payload)) return
    let event = this.toCloudEvent(payload)
    if (!event) return

    this.log('EVENT', event)
    event = this.update(event)
    notify(event)
  }

  /** Whether this event has come already, on another sign-in's socket. Told by what happened, to what, when and by
   *  whom: the same event is the same in each sign-in's copy, whatever else each may be shown of it. */
  seenBefore(payload: any): boolean {
    const event = payload?.data?.event
    if (!event) return false
    const key = JSON.stringify([
      event.type,
      event.state,
      event.action,
      event.timestamp,
      event.session,
      event.actor?.id,
      (event.target || []).map(target => target?.id),
      event.job?.id,
      event.job?.status,
      event.jobDevice?.id,
      event.jobDevice?.status,
      event.owner?.id,
    ])
    const now = Date.now()
    this.seen.forEach((at, old) => now - at > SEEN_FOR_MS && this.seen.delete(old))
    if (this.seen.has(key)) return true
    this.seen.set(key, now)
    return false
  }

  errors(data) {
    const errors = graphQLGetErrors({ data } as AxiosResponse, true)
    return !!errors?.length
  }

  // Convert one parsed GraphQL subscription response (`{data: {event}}`)
  // into the `ICloudEvent` shape the rest of the desktop app consumes.
  // Pre-existing logic from `parse(response)`; only the input changed
  // from a raw WS response to an already-decoded object so the bulk
  // path can call this directly per array element.
  toCloudEvent(json: any): ICloudEvent | undefined {
    const state = store.getState()
    try {
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
        // The person who saw it: the sign-in whose socket it came on. "You" in what follows is that person.
        authUserId: this.viewerId(state),
        authUserIds: selectPersonIds(state),
        platform: event.platform,
        sessionId: event.session,
        source: event.source,
        geo: event.sourceGeo,
        quantity: event.quantity,
        manufacturer: event.manufacturer,
        manufacturerType: getManufacturerType(event.manufacturer, reverseProxy),
        expiration: event.expiration && new Date(event.expiration),
        plan: event.plan,
        // A product at its maximum of devices refused one (ProductFullEvent, where the API has it).
        product: event.product,
        productName: event.productName,
        maxDevices: event.maxDevices,
        via: event.via,
        job: {
          ...event.job,
          jobDevice: event.jobDevice,
          target: selectJob(state, event.job?.owner.id, event.job?.id),
        },
        target: event.target.map(t => {
          const [service, device] = selectById(state, undefined, t.id)
          // The record of whoever connected, where they are signed in here (helpers/connectionRecords).
          const connection = findLocalConnection(state, t.id, event.session, selectPersonSub(state, event.actor?.id))
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
      console.warn('Event parsing error', json, error)
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

          // Every row's copy of the device (copiesOf); where no list holds it, the one the event found.
          const held = copiesOf(store.getState(), target.device?.id)
          const copies: [string, IDevice, RowKey?][] = held.length
            ? held.map(([row, copy]) => [rowAccount(row), structuredClone(copy), row])
            : target.device
            ? [[target.accountId, target.device]]
            : []
          copies.forEach(([, device]) => {
            // if device exists and is the target
            if (device.id === target.id) {
              device.state = onlineState
              device[onlineState === 'active' ? 'onlineSince' : 'offlineSince'] = event.timestamp
            } else {
              // if service exists and is the target
              device.services.forEach(service => {
                if (service.id === target.service?.id) {
                  service.state = onlineState
                }
              })
            }
          })

          // Update connection state
          // Only on change: on desktop this store copy can be older than the backend's and would overwrite it
          // Every record of the service: each sign-in that connected to it has its own (helpers/connectionRecords), and
          // the service being up or down is said of them all — the event is handled once, whoever's copy it found.
          const online = onlineState === 'active'
          const records = (store.getState().connections?.all || []).filter(connection => connection.id === target.id)
          const stated = records.length ? records : target.connection ? [target.connection] : []
          stated.forEach(connection => {
            if (connection.online !== online) setConnection({ ...structuredClone(connection), online })
          })

          // if device exists
          copies.forEach(([accountId, device, row]) => {
            dispatch.accounts.setDevice({ id: device.id, device, accountId, row })
            dispatch.devices.sortByState({ accountId, row })
          })

          // A service not here yet, of a device that is: added since the device was read — or its add not yet in the
          // store, the device taking it up first. Read the device, whose service then has the state this event gave.
          if (!target.service && target.deviceId && target.id !== target.deviceId) {
            const lists = copiesOf(store.getState(), target.deviceId).map(([row]) => rowOf(row))
            const [, loaded] = selectById(store.getState(), undefined, target.deviceId)
            const rows: { accountId: string; sub?: string }[] = lists.length
              ? lists
              : loaded
              ? [{ accountId: target.accountId }]
              : []
            rows.forEach(row =>
              dispatch.devices.fetchSingleFull({ id: target.deviceId, hidden: true, silent: true, ...row })
            )
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
              rowsOf(state, state.devices, target.owner.id).forEach(row =>
                dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: true, ...row })
              )
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
          // proxyConnect owns an in-flight public connect: this host-less copy made auto launch prompt for the host,
          // and on desktop it can land after the connect result and overwrite it
          if (target.connection && !(target.connection.public && target.connection.connecting)) {
            if (target.connection.public) {
              target.connection.enabled = event.state === 'connected'
              if (event.state !== 'connected') {
                target.connection.endTime = Date.now()
                target.connection.ready = false
              }
            }
            target.connection.connected = event.state === 'connected'
            target.connection.connecting = false
            setConnection(target.connection)
          }

          // session state: in each row whose list holds the device (copiesOf) — the row's own account and sign-in, a
          // device shared with two people here being in a row of each one's account — else the row the event's
          // account is looked at through
          if (event.state === 'connected') {
            const state = store.getState()
            const holding = copiesOf(state, target.deviceId).map(([row]) => rowOf(row))
            const rows = holding.length ? holding : [rowOf(selectRowOf(state, target.accountId ?? ''))]
            const session: ISession = {
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
            }
            rows.forEach(({ accountId, sub }) =>
              dispatch.sessions.setSession({ ...session, sub, target: { ...session.target, accountId } })
            )
          } else {
            dispatch.sessions.removeSession(event.sessionId)
          }
        })
        break

      case 'DEVICE_SHARE':
        const state = store.getState()
        const accountIds = getAccountIds(state)
        // don't handle actions you've done — but an account here that the sign-in who did it does not reach (another
        // person signed in beside them) learns of it from this event alone
        const actorSub = selectPersonSub(state, event.actor.id)
        const routes = actorSub === undefined ? {} : selectAccountRoutes(state)
        const doneFor = (id: string) =>
          actorSub !== undefined && (routes[id]?.reach.some(who => who.sub === actorSub) ?? true)
        const accountsTo = event.users.filter(u => accountIds.includes(u.id) && !doneFor(u.id)).map(u => u.id)
        if (!accountsTo.length) break
        const shared = event.target.filter(target => target.typeID === DEVICE_TYPE)

        // device unshared from me or my org: out of their lists alone — whoever else here has it (its owner, another
        // person it is shared with) keeps it, and its connections; gone from here only when no one does
        if (event.action === 'remove') {
          dispatch.devices.cleanupFor({ ids: shared.map(target => target.id), accountIds: accountsTo })
        }

        // device shared or updated with me or my org
        else if (['add', 'update'].includes(event.action)) {
          shared.forEach(target =>
            accountsTo.forEach(accountId =>
              rowsOf(state, state.devices, accountId).forEach(row =>
                dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: event.action === 'add', ...row })
              )
            )
          )
        }
        break

      case 'JOB':
      case 'DEVICE_JOB':
        if (!event.job) break
        console.log('JOB EVENT', event.job)

        // Each row of the job's account that has read its jobs holds the job: every one is told.
        const jobId = event.job.id
        const jobRows = rowsOf(store.getState(), store.getState().jobs.all, event.job.owner.id).map(
          ({ accountId, sub }) => ({ accountId, sub })
        )

        if (!event.job.target) {
          const state = store.getState()
          if (!state.jobs.fetching) jobRows.forEach(row => dispatch.jobs.fetchSingle({ ...row, jobId }))
          break
        }

        const jobDevice = event.job.jobDevice
        const jobDevices = event.job.target.jobDevices

        const changed: IJob = {
          ...event.job.target,
          status: event.job.status,
          jobDevices: jobDevice
            ? jobDevices.map(jd => (jd.device.id === jobDevice.device.id ? { ...jd, status: jobDevice.status } : jd))
            : jobDevices,
        }
        const succeeded = event.type === 'JOB' && event.job.status === 'SUCCESS'
        jobRows.forEach(row => {
          dispatch.jobs.setJobs({ accountId: row.accountId, row: rowKey(row.accountId, row.sub), jobs: [changed] })

          // A run's event changes its job's counts, which only the job read again says (its runs are not all held).
          if (jobDevice) dispatch.jobs.refreshSoon({ ...row, jobId })

          if (succeeded) dispatch.jobs.fetchSingle({ ...row, jobId })
        })

        break

      case 'DEVICE_REFRESH':
        // Each device, in every row's list that holds it (copiesOf): read again for each, as the row's sign-in.
        const refresh = new Map<string, { row: { accountId: string; sub?: string }; ids: string[] }>()
        event.target.forEach(target => {
          // Check that it's the bulk service and that the device is loaded in the ui
          if (target.typeID !== DEVICE_TYPE || !target.device) return
          const lists = copiesOf(store.getState(), target.deviceId).map(([row]) => rowOf(row))
          ;(lists.length ? lists : [{ accountId: target.accountId, sub: undefined }]).forEach(row => {
            const key = `${row.accountId} ${row.sub ?? '-'}`
            if (!refresh.has(key)) refresh.set(key, { row, ids: [] })
            refresh.get(key)!.ids.push(target.deviceId)
          })
        })
        refresh.forEach(({ row, ids: refreshIds }) => {
          // avoid double loading device if on the device page
          for (const id of [...refreshIds]) {
            if (window.location.href.includes(id)) {
              dispatch.devices.fetchSingleFull({ id, hidden: true, silent: true, ...row })
              refreshIds.splice(refreshIds.indexOf(id), 1)
            }
          }
          // fetch the rest
          if (refreshIds.length) dispatch.devices.fetchDevices({ ids: refreshIds, ...row })
        })
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
          // To any of the people signed in here: the old owner's copy may be the one handled, the new owner's passed over
          const isReceiving = !!newOwnerId && event.authUserIds.includes(newOwnerId)

          this.log('DEVICE TRANSFER EVENT', { isReceiving, newOwnerId, authUserIds: event.authUserIds }, event)

          if (isReceiving) {
            // Held here already — by the old owner signed in beside the new, or shared before: out of that list first
            if (target.device) await dispatch.accounts.removeDevice(target.deviceId)
            // NEW OWNER: Refresh device list to show transferred device
            dispatch.ui.set({ successMessage: `${target.name} was transferred to you!` })
            rowsOf(store.getState(), store.getState().devices, newOwnerId).forEach(row =>
              dispatch.devices.fetchSingleFull({ id: target.deviceId, newDevice: true, ...row })
            )
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

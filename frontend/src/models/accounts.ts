import i18n from '../i18n'
import { State } from '../store'
import { oidcSignIns } from '../services/oidc'
import {
  ISignIn,
  getSignIns,
  rowGone,
  selectAccountRoutes,
  selectActiveSub,
  selectRowOf,
  storedRows,
  selectSignInSub,
} from '../selectors/signIns'
import { createModel } from '@rematch/core'
import { deviceRows, getDeviceModelFn, getDevices } from '../selectors/devices'
import { RowKey, rowAccount, rowKey, rowSub } from '../helpers/rowKey'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLCreateOrganization, graphQLLeaveMembership } from '../services/graphQLMutation'
import { graphQLBasicRequest, refusalOf } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { mergeDevice } from './devices'
import { forgetAccountCaches, forgetRowCaches, rowChanged } from '../services/accountCaches'
import { RootModel } from '.'

export type IAccountsState = {
  membership: IMembership[]
  activeId?: string // user.id
  // With activeId, the selected ROW: the sign-in ('' the page's own person) whose row of the account was picked.
  activeSub?: string
  // What is stored is kept by row (helpers/rowKey), to this version of it: less on state stored before (keepByRow).
  byRow?: boolean | number
  // The sign-ins in use beside the page's own person, by sub (selectors/signIns): each one's account and organizations.
  signIns?: ILookup<ISignIn>
  // The page's own person's sub, as last signed in: says whose the stored data is when another person's page boots.
  primarySub?: string
  standaloneOrganizations?: boolean
  pendingOrganizationClosures?: PendingOrganizationClosure[]
}

export type PendingOrganizationClosure = { organizationId: string; name: string }

function membershipFrom(data): IMembership {
  const { account, name, standalone } = data.organization
  return {
    created: new Date(data.created),
    roleId: data.customRole.id,
    roleName: data.customRole.name,
    license: data.license || 'UNKNOWN',
    account: { ...account, email: account.email || '' },
    name,
    // Older servers use the same query, and every login-backed organization has an account email.
    standalone: standalone ?? account.email == null,
  }
}

/* What a change to the sign-ins or the memberships does to the rows: those `gone`, those `moved` — still rows, but
   served by another sign-in than the one their stored data was read as — and those `added`. */
function rowsAfter(state: State, change: Partial<IAccountsState>) {
  const before = selectAccountRoutes(state)
  const after = selectAccountRoutes({ ...state, accounts: { ...state.accounts, ...change } } as State)
  const ids = Object.keys(before)
  return {
    gone: ids.filter(id => !after[id]),
    moved: ids.filter(id => after[id] && after[id].sub !== before[id].sub),
    added: Object.keys(after).filter(id => !before[id]),
  }
}

/* WHAT THE STORE KEEPS BY ROW (helpers/rowKey): each of these models keeps an account's data once for every sign-in
   that has read it, and says how it loses accounts (`forget`), loses rows (`forgetRows`) and has its rows said again
   (`rekey`). */
const BY_ROW = [
  'devices',
  'products',
  'partnerStats',
  'networks',
  'files',
  'jobs',
  'tags',
  'organization',
  'applicationTypes',
] as const

/* The rows kept under a sign-in that no longer reaches their account: it left, or left the organization — and the
   rows of an account that is no row at all any more. */
const goneRows = (state: State): RowKey[] => storedRows(state).filter(row => rowGone(state, row))

/* State stored by row to this version. Before it, every account's data was under its plain id (1: the devices alone
   by row; 2: everything by row, with the sign-in an organization was looked at through kept apart from the selected
   row, by account id — `via`). */
const KEPT_BY_ROW = 3

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
  signIns: {},
  byRow: KEPT_BY_ROW,
}

const SIGN_IN_QUERY = ` query SignIn {
    login {
      id
      email
      membership {
        created
        customRole {
          id
          name
        }
        license
        organization {
          name
          account {
            id
            email
            picture
          }
        }
      }
    }
  }`

// Each reading of the further sign-ins, counted: only the last one asked for writes what it found (fetchSignIns).
let signInsRead = 0

export default createModel<RootModel>()({
  state: { ...accountsState },
  effects: dispatch => ({
    async fetch() {
      void dispatch.accounts.fetchOrganizationClosures()
      // Beside the primary's own, and done with it: what is read next by account (organization.fetch, in the cloud
      // sync) then asks about every sign-in's rows as they are now.
      const signIns = dispatch.accounts.fetchSignIns()
      const result = await graphQLBasicRequest(
        ` query Accounts {
              login {
                membership {
                  created
                  customRole {
                    id
                    name
                  }
                  license
                  organization {
                    name
                    account {
                      id
                      email
                      picture
                    }
                  }
                }
              }
            }`
      )
      if (result !== 'ERROR') await dispatch.accounts.parse(result)
      await signIns
    },
    async parse(gqlResponse: AxiosResponse<any>, state) {
      const gqlData = gqlResponse.data?.data?.login
      console.log('MEMBERSHIPS', gqlData)
      if (!gqlData) return
      const membership = gqlData.membership || []
      const memberships: IMembership[] = membership.map(membershipFrom)
      // Only an organization the user has left is stale - their own id means they
      // deliberately selected their personal account, which selectDefaultAccountId reads.
      const activeId = state.accounts.activeId
      const userId = state.auth.user?.id || state.user.id
      // A row another sign-in serves is that sign-in's to keep or drop (fetchSignIns).
      const others = Object.values(getSignIns(state)).some(
        signIn => signIn.id === activeId || signIn.membership.some(m => m.account.id === activeId)
      )
      const stale =
        !!activeId && activeId !== userId && !others && !memberships.some(m => m.account.id === activeId)
      if (stale) dispatch.ui.set({ selected: [], selectionAnchor: undefined })
      // An organization the primary no longer belongs to, that another sign-in still reaches, is that sign-in's now.
      const { moved } = rowsAfter(state, { membership: memberships })
      dispatch.accounts.set({ membership: memberships, ...(stale ? { activeId: undefined } : {}) })
      if (moved.length) await dispatch.accounts.readAgain(moved)
    },
    /* Every further sign-in's own account and organizations, asked with that sign-in's token: its rows join the
       switcher, and requests about them are made as it. A sign-in no longer in use loses its rows and what was
       stored for them; one that could not be asked this time keeps what was known. */
    async fetchSignIns(_: void, state) {
      const read = ++signInsRead
      const others = oidcSignIns().filter(signIn => !signIn.primary)
      if (!others.length && !Object.keys(getSignIns(state)).length) return
      const known = getSignIns(state)
      const found = await Promise.all(
        others.map(async ({ sub, email }): Promise<ISignIn | undefined> => {
          const result = await graphQLBasicRequest(SIGN_IN_QUERY, {}, true, { sub })
          const login = result === 'ERROR' ? undefined : result.data?.data?.login
          if (!login?.id) return known[sub]
          return {
            sub,
            id: login.id,
            email: login.email || email || '',
            membership: (login.membership || []).map(membershipFrom),
          }
        })
      )
      // Asked again since (an account brought into use meanwhile): that reading has them all, and is the one kept —
      // this one's answers, of fewer accounts, would take the new one's rows and what is stored for them away.
      if (read !== signInsRead) return
      // Asked of the sign-ins as they are now: one that left while the answers came is not put back.
      const inUse = new Set(oidcSignIns().map(signIn => signIn.sub))
      const signIns: ILookup<ISignIn> = {}
      found.forEach(signIn => signIn && inUse.has(signIn.sub) && (signIns[signIn.sub] = signIn))
      await dispatch.accounts.setSignIns(signIns)
    },
    async setSignIns(signIns: ILookup<ISignIn>, state) {
      const { gone, moved, added } = rowsAfter(state, { signIns })
      await dispatch.accounts.set({ signIns })
      // A sign-in that left, or left an organization: its rows go, every other row stays as it was read.
      dispatch.accounts.forgetRows(goneRows({ ...state, accounts: { ...state.accounts, signIns } } as State))
      if (gone.length) {
        if (state.accounts.activeId && gone.includes(state.accounts.activeId)) {
          await dispatch.accounts.select(state.auth.user?.id || state.user.id)
        }
        dispatch.accounts.forgetData(gone)
      }
      // A row two sign-ins reach, whose serving one left or was put behind another: the other's from now on.
      if (moved.length) await dispatch.accounts.readAgain(moved)
      // The new rows' organizations (names, licenses, limits) are read as the sign-in that serves them: a sign-in's
      // that joins, and one an account already here has joined since.
      else if (added.length) void dispatch.organization.fetch()
    },
    /** Accounts whose sign-in changed out from under them — the one they were looked at through left, or left the
     *  organization — and another reaches them still. Everything is kept by row, so nothing of the other sign-in's is
     *  stale: the rows that are gone are dropped, and the selected account is looked at through the row it has now,
     *  which is read if it never was. */
    async readAgain(accountIds: string[], state) {
      const active = selectActiveAccountId(state)
      const runs =
        accountIds.includes(active) && Object.keys(state.jobs?.all || {}).some(row => rowAccount(row) === active)
      dispatch.accounts.forgetRows(goneRows(state))
      void dispatch.organization.fetch()
      if (!accountIds.includes(active)) return
      // Its runs too where they had been read, which a change of row does not read (the runs page does, and it is
      // not opened again by this).
      await dispatch.accounts.select(active)
      if (runs && !state.jobs.all[selectRowOf(state, active)]) dispatch.jobs.fetch({ accountId: active })
    },
    /** What is stored for accounts that are no longer rows: every row of them, out of every model. */
    forgetData(accountIds: string[]) {
      if (!accountIds.length) return
      BY_ROW.forEach(model => dispatch[model].forget(accountIds))
      forgetAccountCaches(accountIds)
    },
    /** Rows that are no more — a sign-in that left takes its rows with it — out of every model; every other row,
     *  the same account's under another sign-in included, stays. */
    forgetRows(rows: RowKey[]) {
      if (!rows.length) return
      BY_ROW.forEach(model => dispatch[model].forgetRows(rows))
      forgetRowCaches(rows)
    },
    /** Every row said again, each by its new key, in every model: the page's person changed, and with it whose row a
     *  plain key is (models/auth adoptAccountData). A row not said is dropped. */
    rekey(rows: ILookup<RowKey>) {
      BY_ROW.forEach(model => dispatch[model].rekey(rows))
    },
    /** A row of the switcher picked: the account selected AS the sign-in the row is under (`sub`, '' the page's own
     *  person). Each sign-in's row of it is kept as read, so nothing is dropped: the row is read if it never was, and
     *  what a page reads for itself is read again as it (select). A sign-in that does not reach the account picks
     *  nothing: the account is selected as it is looked at. */
    async selectAs({ accountId, sub }: { accountId: string; sub: string }, state) {
      const reaches = selectAccountRoutes(state)[accountId]?.reach.some(who => who.sub === sub)
      await dispatch.accounts.select(reaches ? { accountId, sub } : accountId)
    },
    /** State stored before it was kept by row had every account's data under its plain id — which is now the page's
     *  own person's row of it. What was read as another sign-in (its own account, an organization it serves) is
     *  dropped, once, the moment the stored state is read back (store.ts) — before anything asks of it — and read
     *  again into that sign-in's row when the row is looked at. */
    keepByRow(_: void, state) {
      const kept = state.accounts.byRow === true ? 1 : state.accounts.byRow || 0
      if (kept === KEPT_BY_ROW) return
      // The sign-in each account was looked at through then (`via`, where another was picked for it): whose what is
      // stored under a plain id was read as. Of it, the selected account's becomes the selected row; the rest is not
      // kept — an account not selected is looked at through the page's own person's row where they belong to it.
      const via: ILookup<string> = (state.accounts as { via?: ILookup<string> }).via || {}
      const active = selectActiveAccountId(state)
      const activeSub = state.accounts.activeSub ?? via[active]
      if (kept < 2) {
        const routes = selectAccountRoutes(state)
        const readAs = (id: string) => via[id] ?? routes[id]?.reach[0]?.sub ?? ''
        dispatch.accounts.forgetRows(storedRows(state).filter(row => !rowSub(row) && !!readAs(rowAccount(row))))
      }
      dispatch.accounts.set({ byRow: KEPT_BY_ROW, activeSub, ...({ via: undefined } as object) })
    },
    async fetchOrganizationClosures() {
      const result = await graphQLBasicRequest(
        '{ pendingOrganizationClosures { organizationId name } }',
        {},
        true
      )
      if (result === 'ERROR') return
      const pending = result.data?.data?.pendingOrganizationClosures
      if (!Array.isArray(pending)) return
      dispatch.accounts.set({
        standaloneOrganizations: true,
        pendingOrganizationClosures: pending,
      })
    },
    async createOrganization({ name, submissionId }: { name: string; submissionId: string }): Promise<string | undefined> {
      const result = await graphQLCreateOrganization(name, submissionId)
      if (result === 'ERROR' || 'reason' in result) return refusalOf(result) ?? ''
      const data = result.data?.data?.createOrganization
      if (!data) return ''
      const member = membershipFrom(data)
      await dispatch.organization.setActive({ id: member.account.id, name: member.name })
      dispatch.accounts.addMembership(member)
      void dispatch.organization.fetch()
    },
    async organizationClosed(id: string, state) {
      const active = selectActiveAccountId(state) === id
      dispatch.accounts.removeMembership(id)
      if (active) await dispatch.accounts.select(state.user.id)
      void dispatch.accounts.fetchOrganizationClosures()
      void dispatch.organization.fetch()
      return active
    },
    /*
      The one way to switch accounts - every account scoped list has to be re-fetched
      or it keeps showing the previous account's data. Callers own their navigation.
    */
    async select(row: string | { accountId: string; sub: string }, state) {
      const accountId = typeof row === 'string' ? row : row.accountId
      const before = selectActiveAccountId(state)
      await dispatch.logs.reset()
      if (accountId !== before) await dispatch.ui.set({ selected: [], selectionAnchor: undefined })
      // The row selected: the account, under the sign-in said; with none said, the row it is looked at through — the
      // selected one where it is selected already, else the page's own person's where they belong to it, else the
      // first sign-in's that does (selectors/signIns selectAccountRoutes).
      const sub = typeof row === 'string' ? selectSignInSub(state, accountId) || '' : row.sub
      // Its runs where the row left had them read and this one's never were: the runs page is not opened again by a
      // change of row alone.
      const runs = accountId === before && !!state.jobs?.all?.[selectRowOf(state, accountId)]
      await dispatch.accounts.set({ activeId: accountId, activeSub: sub })
      // Another row, looked at through another sign-in: what a page reads for itself by a device's or a service's id,
      // which may be in both rows, is read again as this one (hooks/useReadAgain).
      if (selectActiveSub(state) !== sub) rowChanged()
      if (runs && !state.jobs.all[rowKey(accountId, sub)]) dispatch.jobs.fetch({ accountId, sub })
      dispatch.networks.fetchIfEmpty()
      dispatch.devices.fetchIfEmpty()
      dispatch.files.fetchIfEmpty()
      dispatch.tags.fetchIfEmpty()
      dispatch.products.fetchIfEmpty()
      dispatch.partnerStats.fetchIfEmpty()
    },
    /** The page's own person leaves an organization: asked as them outright, whichever sign-in serves its row — it is
     *  their membership the pages that offer this list, and their membership that goes from here. */
    async leaveMembership(id: string, state) {
      const { membership } = state.accounts
      const result = await graphQLLeaveMembership(id, '')
      if (result !== 'ERROR') {
        const remaining = membership.filter(m => m.account.id !== id)
        dispatch.accounts.set({ membership: remaining })
        // Theirs no longer: their row of it goes. Another sign-in's row of it, where one here belongs to it still,
        // stays as read — and its organization is read for whoever looks at it next.
        dispatch.accounts.forgetRows([rowKey(id)])
        if (selectAccountRoutes(state)[id]?.reach.some(who => who.sub)) void dispatch.organization.fetch()
        await dispatch.accounts.select(state.user.id)
        dispatch.ui.set({
          successMessage: i18n.t('notices:organization.left', {
            defaultValue: 'You have successfully left the organization.',
          }),
        })
      }
    },
    /* A row's device list. Each of these takes the account, and where the caller acts for one row of it — an answer
       to what was asked as that row, a list gone through row by row — the `row` (helpers/rowKey); with none it is
       the row the account is looked at through (selectRowOf). */
    async setDevices({ devices, accountId, row }: { devices: IDevice[]; accountId?: string; row?: RowKey }) {
      await dispatch.devices.set({ all: devices, accountId, row })
    },
    /*
       Takes new list of devices and merges the existing into them
       -- forgets any existing devices that are not in the new devices
       -- used when new device list query is made
    */
    async truncateMergeDevices(
      { devices, accountId, row }: { devices?: IDevice[]; accountId: string; row?: RowKey },
      state
    ) {
      if (!devices) return
      const all = rowDevices(state, accountId, row)
      const mergedDevices = devices.map(device => {
        const overwrite = all.find(o => o.id === device.id)
        if (!overwrite) return device
        return mergeDevice(overwrite, device)
      })

      await dispatch.accounts.setDevices({ devices: mergedDevices, accountId, row })
    },
    /*     
      Keeps the existing devices and device list order and merges in newly loaded device data
      -- For adding hidden device data or fully loaded device data
    */
    async mergeDevices({ devices, accountId, row }: { devices?: IDevice[]; accountId: string; row?: RowKey }, state) {
      if (!devices || !devices.length) return
      const all = rowDevices(state, accountId, row)
      const devicesMap = new Map(devices.map(device => [device.id, device]))

      let mergedDevices: IDevice[] = all.map(overwrite => {
        const device = devicesMap.get(overwrite.id)
        if (device) {
          return mergeDevice(overwrite, device)
        } else {
          return overwrite
        }
      })

      const append: IDevice[] = devices.filter(k => !all.find(ow => ow.id === k.id))
      if (append.length) console.log('APPENDING DEVICES IN MERGE', { mergeDevice, append })

      await dispatch.accounts.setDevices({ devices: [...mergedDevices, ...append], accountId, row })
    },
    /* 
      Used when loading more devices from device list 
    */
    async appendUniqueDevices(
      { devices, accountId, row }: { devices?: IDevice[]; accountId: string; row?: RowKey },
      state
    ) {
      if (!devices?.length) return

      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('APPEND DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })

      const devicesMap = new Map(devices.map(device => [device.id, device]))
      const existingDevices = rowDevices(state, accountId, row).filter(ed => !devicesMap.has(ed.id))

      await dispatch.accounts.setDevices({
        devices: [...existingDevices, ...devices],
        accountId,
        row,
      })
    },
    async setDevice(
      {
        id,
        accountId,
        row,
        device,
        prepend,
        suppressAdd,
      }: {
        id: string
        accountId?: string
        row?: RowKey
        device?: IDevice
        prepend?: boolean
        suppressAdd?: boolean
      },
      state
    ) {
      accountId = accountId || device?.accountId
      if (!accountId) return console.error('SET DEVICE WITH MISSING ACCOUNT ID', { id, accountId, device })

      const previousDevices = rowDevices(state, accountId, row)
      let updated = false

      const devices = previousDevices
        .map(d => {
          if (d.id === id) {
            updated = true
            return device ? { ...device, hidden: d.hidden } : null
          }
          return d
        })
        .filter((d): d is IDevice => !!d)

      // Add if new (unless suppressed because it doesn't match the active filter)
      if (!updated && device && !suppressAdd) prepend ? devices.unshift(device) : devices.push(device)
      await dispatch.accounts.setDevices({ devices, accountId, row })
    },
    /* 
      Remove all references to a device for cleanup after device is deleted
     */
    async removeDevice(id: string) {
      await dispatch.accounts.removeDeviceFrom({ id })
    },
    /** Out of the lists of `accountIds` alone — every row of each — or of `rows` alone, where given: a device those
     *  lost that others here may still have. True when another row's list holds it still (the lists kept beside the
     *  rows' do not count). */
    async removeDeviceFrom(
      { id, accountIds, rows }: { id: string; accountIds?: string[]; rows?: RowKey[] },
      state
    ): Promise<boolean> {
      const accounts = getAccountIds(state)
      let kept = false
      for (const row of deviceRows(state.devices)) {
        const accountId = rowAccount(row)
        const all = state.devices[row].all
        if ((accountIds && !accountIds.includes(accountId)) || (rows && !rows.includes(row))) {
          kept ||= accounts.includes(accountId) && all.some(d => d.id === id)
          continue
        }
        const filtered = all.filter(d => d.id !== id)
        if (filtered.length !== all.length) {
          await dispatch.accounts.setDevices({ devices: filtered, accountId, row })
          // A disabled device was never in the total (graphql leaves it out of the list).
          if (!all.find(d => d.id === id)?.disabled)
            await dispatch.devices.set({ total: state.devices[row].total - 1, accountId, row })
        }
      }
      return kept
    },
  }),
  reducers: {
    addMembership(state: IAccountsState, member: IMembership) {
      state.membership = [...state.membership.filter(existing => existing.account.id !== member.account.id), member]
      return state
    },
    removeMembership(state: IAccountsState, id: string) {
      state.membership = state.membership.filter(member => member.account.id !== id)
      state.pendingOrganizationClosures = state.pendingOrganizationClosures?.filter(closure => closure.organizationId !== id)
      return state
    },
    reset(state: IAccountsState) {
      state = { ...accountsState }
      return state
    },
    set(state: IAccountsState, params: Partial<IAccountsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

// A row's devices: the row said, else the one the account is looked at through.
const rowDevices = (state: State, accountId: string, row?: RowKey): IDevice[] =>
  row === undefined ? getDevices(state, accountId) : getDeviceModelFn(state.devices, row).all || []

export function accountFromDevice(state: State, ownerId: string, access: string[]) {
  const userId = state.auth.user?.id || state.user.id
  const orgIds = getAccountIds(state).filter(id => id !== userId)
  orgIds.push(userId) // add current user to accounts

  // My device
  if (userId === ownerId) return ownerId
  // Org device
  if (orgIds.includes(ownerId)) return ownerId
  // Shared device
  const sharedId = orgIds.find(a => access.includes(a))
  if (sharedId) return sharedId
  // Default
  return userId
}

/** Every account that is a row: the page's own person first, the organizations they belong to, then each further
 *  sign-in's own account and organizations. */
export function getAccountIds(state: State) {
  let ids = state.accounts.membership.map(m => m.account.id)
  state.auth.user && ids.unshift(state.auth.user.id)
  Object.keys(selectAccountRoutes(state)).forEach(id => ids.includes(id) || ids.push(id))
  return ids
}

/** Account ids by each sign-in that reaches them ('' the page's own person): what is kept by row is read once for
 *  every row — an organization two sign-ins belong to by each of them. */
export function accountIdsByReach(state: State, ids: string[]): [sub: string, ids: string[]][] {
  const routes = selectAccountRoutes(state)
  const groups: ILookup<string[]> = {}
  ids.forEach(id => (routes[id]?.reach || [{ sub: '' }]).forEach(who => (groups[who.sub] ??= []).push(id)))
  return Object.entries(groups)
}

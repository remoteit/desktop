import i18n from '../i18n'
import { State } from '../store'
import { oidcSignIns } from '../services/oidc'
import { ISignIn, getSignIns, selectAccountRoutes, selectSignInSub } from '../selectors/signIns'
import { createModel } from '@rematch/core'
import { getDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLCreateOrganization, graphQLLeaveMembership } from '../services/graphQLMutation'
import { graphQLBasicRequest, refusalOf } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { mergeDevice } from './devices'
import { forgetAccountCaches, rowChanged } from '../services/accountCaches'
import { RootModel } from '.'

export type IAccountsState = {
  membership: IMembership[]
  activeId?: string // user.id
  // The sign-ins in use beside the page's own person, by sub (selectors/signIns): each one's account and organizations.
  signIns?: ILookup<ISignIn>
  // The sign-in the person picked for an organization more than one reaches, by account id.
  via?: ILookup<string>
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

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
  signIns: {},
  via: {},
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
    /** Rows now served by another sign-in: what was stored for them was read as the one before — maybe in another
     *  role, or seeing other devices — so it is dropped and read again as the one that serves them now. */
    async readAgain(accountIds: string[], state) {
      const active = selectActiveAccountId(state)
      const runs = accountIds.includes(active) && !!state.jobs?.all?.[active]
      dispatch.accounts.forgetData(accountIds)
      void dispatch.organization.fetch()
      if (!accountIds.includes(active)) return
      // Selected: its lists are read again, now that nothing is stored for it — its runs too where they were read,
      // which a change of account does not read (the runs page does, and it is not opened again by this).
      await dispatch.accounts.select(active)
      if (runs) dispatch.jobs.fetch({ accountId: active })
    },
    /** What is stored for accounts that are no longer rows: dropped from every list kept by account id. */
    forgetData(accountIds: string[]) {
      if (!accountIds.length) return
      dispatch.devices.forget(accountIds)
      dispatch.products.forget(accountIds)
      dispatch.partnerStats.forget(accountIds)
      dispatch.networks.forget(accountIds)
      dispatch.files.forget(accountIds)
      dispatch.jobs.forget(accountIds)
      dispatch.tags.forget(accountIds)
      dispatch.organization.forget(accountIds)
      dispatch.applicationTypes.forget(accountIds)
      forgetAccountCaches(accountIds)
    },
    /** Serve an organization more than one sign-in reaches through `sub` ('' the page's own person) from now on:
     *  what was stored for it was read as the other sign-in, so it is read again. Nothing for a sign-in that does not
     *  reach it. */
    async setVia({ accountId, sub }: { accountId: string; sub: string }, state) {
      if ((selectSignInSub(state, accountId) || '') === sub) return
      if (!selectAccountRoutes(state)[accountId]?.reach.some(who => who.sub === sub)) return
      await dispatch.accounts.set({ via: { ...state.accounts.via, [accountId]: sub } })
      await dispatch.accounts.readAgain([accountId])
    },
    /** A row of the switcher picked: the organization selected AS the account the row is under — served by that
     *  account's sign-in from now on (setVia: what was stored for it as another is read again), and selected. */
    async selectAs({ accountId, sub }: { accountId: string; sub: string }) {
      await dispatch.accounts.setVia({ accountId, sub })
      await dispatch.accounts.select(accountId)
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
    async select(accountId: string, state) {
      await dispatch.logs.reset()
      if (accountId !== selectActiveAccountId(state))
        await dispatch.ui.set({ selected: [], selectionAnchor: undefined })
      await dispatch.accounts.set({ activeId: accountId })
      // Another account's row, looked at through another sign-in: what a page reads for itself by a device's or a
      // service's id, which may be in both rows, is read again as this one (hooks/useReadAgain).
      if ((selectSignInSub(state, selectActiveAccountId(state)) || '') !== (selectSignInSub(state, accountId) || ''))
        rowChanged()
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
        // Left as the primary, and still a row through another sign-in: read as that one from now on.
        const { moved } = rowsAfter(state, { membership: remaining })
        dispatch.accounts.set({ membership: remaining })
        if (moved.length) {
          dispatch.accounts.forgetData(moved)
          void dispatch.organization.fetch()
        }
        await dispatch.accounts.select(state.user.id)
        dispatch.ui.set({
          successMessage: i18n.t('notices:organization.left', {
            defaultValue: 'You have successfully left the organization.',
          }),
        })
      }
    },
    async setDevices({ devices, accountId }: { devices: IDevice[]; accountId?: string }) {
      await dispatch.devices.set({ all: devices, accountId })
    },
    /*
       Takes new list of devices and merges the existing into them
       -- forgets any existing devices that are not in the new devices
       -- used when new device list query is made
    */
    async truncateMergeDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices) return
      const all = getDevices(state, accountId)
      const mergedDevices = devices.map(device => {
        const overwrite = all.find(o => o.id === device.id)
        if (!overwrite) return device
        return mergeDevice(overwrite, device)
      })

      await dispatch.accounts.setDevices({ devices: mergedDevices, accountId })
    },
    /*     
      Keeps the existing devices and device list order and merges in newly loaded device data
      -- For adding hidden device data or fully loaded device data
    */
    async mergeDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices || !devices.length) return
      const all = getDevices(state, accountId)
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

      await dispatch.accounts.setDevices({ devices: [...mergedDevices, ...append], accountId })
    },
    /* 
      Used when loading more devices from device list 
    */
    async appendUniqueDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices?.length) return

      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('APPEND DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })

      const devicesMap = new Map(devices.map(device => [device.id, device]))
      const existingDevices = getDevices(state, accountId).filter(ed => !devicesMap.has(ed.id))

      await dispatch.accounts.setDevices({
        devices: [...existingDevices, ...devices],
        accountId,
      })
    },
    async setDevice(
      {
        id,
        accountId,
        device,
        prepend,
        suppressAdd,
      }: { id: string; accountId?: string; device?: IDevice; prepend?: boolean; suppressAdd?: boolean },
      state
    ) {
      accountId = accountId || device?.accountId
      if (!accountId) return console.error('SET DEVICE WITH MISSING ACCOUNT ID', { id, accountId, device })

      const previousDevices = getDevices(state, accountId)
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
      await dispatch.accounts.setDevices({ devices, accountId })
    },
    /* 
      Remove all references to a device for cleanup after device is deleted
     */
    async removeDevice(id: string) {
      await dispatch.accounts.removeDeviceFrom({ id })
    },
    /** Out of the lists of `accountIds` alone, where given: a device those accounts lost that others here may still
     *  have. True when another account's list holds it still (the lists kept beside the accounts' do not count). */
    async removeDeviceFrom({ id, accountIds }: { id: string; accountIds?: string[] }, state): Promise<boolean> {
      const rows = getAccountIds(state)
      let kept = false
      for (const accountId in state.devices) {
        const all = state.devices[accountId].all
        if (accountIds && !accountIds.includes(accountId)) {
          kept ||= rows.includes(accountId) && all.some(d => d.id === id)
          continue
        }
        const filtered = all.filter(d => d.id !== id)
        if (filtered.length !== all.length) {
          await dispatch.accounts.setDevices({ devices: filtered, accountId })
          // A disabled device was never in the total (graphql leaves it out of the list).
          if (!all.find(d => d.id === id)?.disabled)
            await dispatch.devices.set({ total: state.devices[accountId].total - 1, accountId })
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

/** Account ids by the sign-in that serves them ('' the page's own person): a request that names several accounts is
 *  made once per sign-in, each asking only about its own. */
export function accountIdsBySignIn(state: State, ids: string[]): [sub: string, ids: string[]][] {
  const groups: ILookup<string[]> = {}
  ids.forEach(id => (groups[selectSignInSub(state, id) || ''] ??= []).push(id))
  return Object.entries(groups)
}

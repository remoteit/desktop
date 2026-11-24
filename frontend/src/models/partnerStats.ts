import { createModel } from '@rematch/core'
import { RootModel } from '.'
import { graphQLPartnerEntities } from '../services/graphQLRequest'
import { rowSaid, selectRow } from '../selectors/accounts'
import { asRow, rowGone } from '../selectors/signIns'
import { RowKey, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { State } from '../store'

export interface IPartnerEntityUser {
  id: string
  email: string
  deviceCount: number
  online: number
  active: number
  activated: number
  updated?: Date
}

export interface IPartnerEntity {
  id: string
  name: string
  parent?: {
    id: string
    name: string
    deviceCount: number
    online: number
    active: number
    activated: number
  } | null
  deviceCount: number
  online: number
  active: number
  activated: number
  updated?: Date
  admins?: IPartnerEntityUser[]
  registrants?: IPartnerEntityUser[]
  children?: IPartnerEntity[]
}

export type PartnerStatsState = {
  initialized: boolean
  fetching: boolean
  all: IPartnerEntity[]
  flattened: IPartnerEntity[] // All partners including children
}

export const defaultState: PartnerStatsState = {
  initialized: false,
  fetching: false,
  all: [],
  flattened: [],
}

type PartnerStatsAccountState = {
  [row: string]: PartnerStatsState // by ROW (helpers/rowKey); beside the rows, `default`
}

const defaultAccountState: PartnerStatsAccountState = {
  default: { ...defaultState },
}

// Helper to get partner stats state for a specific account
// The partner stats of the row an account is looked at through (the selected row's where none is named), or of `row`.
export function getPartnerStats(state: State, accountId?: string, row?: RowKey): PartnerStatsState {
  return state.partnerStats[row ?? selectRow(state, accountId)] || state.partnerStats.default || defaultState
}

export function getHasPartner(state: State, accountId?: string): boolean {
  const ps = getPartnerStats(state, accountId)
  return ps.initialized && ps.all.length > 0
}

// Helper to flatten partner entities (including children)
function flattenPartners(entities: IPartnerEntity[]): IPartnerEntity[] {
  const allPartners: IPartnerEntity[] = []
  const addedIds = new Set<string>()

  entities.forEach((entity: IPartnerEntity) => {
    if (!addedIds.has(entity.id)) {
      allPartners.push(entity)
      addedIds.add(entity.id)
    }

    // Add children if they exist and haven't been added
    if (entity.children) {
      entity.children.forEach((child: IPartnerEntity) => {
        if (!addedIds.has(child.id)) {
          // Add parent reference to child
          const childWithParent = {
            ...child,
            parent: {
              id: entity.id,
              name: entity.name,
              deviceCount: entity.deviceCount,
              online: entity.online,
              active: entity.active,
              activated: entity.activated,
            }
          }
          allPartners.push(childWithParent)
          addedIds.add(child.id)
        }

        // Add grandchildren
        if (child.children) {
          child.children.forEach((grandchild: IPartnerEntity) => {
            if (!addedIds.has(grandchild.id)) {
              // Add parent reference to grandchild
              const grandchildWithParent = {
                ...grandchild,
                parent: {
                  id: child.id,
                  name: child.name,
                  deviceCount: child.deviceCount,
                  online: child.online,
                  active: child.active,
                  activated: child.activated,
                }
              }
              allPartners.push(grandchildWithParent)
              addedIds.add(grandchild.id)
            }
          })
        }
      })
    }
  })

  return allPartners
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      // The row they are read for: asked as its sign-in, and kept under it whichever row is looked at by then.
      const { accountId, row } = rowSaid(state)
      dispatch.partnerStats.set({ fetching: true, accountId, row })
      const response = await graphQLPartnerEntities(accountId, asRow(row))
      if (response !== 'ERROR') {
        const entities = response?.data?.data?.login?.account?.partnerEntities || []
        const flattened = flattenPartners(entities)
        dispatch.partnerStats.set({ all: entities, flattened, initialized: true, accountId, row })
      }
      dispatch.partnerStats.set({ fetching: false, accountId, row })
    },

    async fetchIfEmpty(_: void, state) {
      const ps = getPartnerStats(state)
      // Only fetch if not initialized for this account
      if (!ps.initialized) {
        await dispatch.partnerStats.fetch()
      }
    },

    // Set effect that updates state for a specific account
    async set(params: Partial<PartnerStatsState> & { accountId?: string; row?: RowKey }, state) {
      const row = params.row ?? selectRow(state, params.accountId)
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (params.row && rowGone(state, params.row)) return
      const partnerStatsState = { ...getPartnerStats(state, undefined, row) }

      Object.keys(params).forEach(key => {
        if (key !== 'accountId' && key !== 'row') {
          partnerStatsState[key] = params[key]
        }
      })

      await dispatch.partnerStats.rootSet({ [row]: partnerStatsState })
    },
  }),
  reducers: {
    reset(state: PartnerStatsAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state: PartnerStatsAccountState, accountIds: string[]) {
      return withoutAccounts(state, accountIds)
    },
    forgetRows(state: PartnerStatsAccountState, rows: string[]) {
      return withoutRows(state, rows)
    },
    rekey(state: PartnerStatsAccountState, rows: ILookup<RowKey>) {
      return { default: state.default, ...rekeyed(state, rows) }
    },
    rootSet(state: PartnerStatsAccountState, params: PartnerStatsAccountState) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

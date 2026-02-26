import { createModel } from '@rematch/core'
import { RootModel } from '.'
import { graphQLPartnerEntities } from '../services/graphQLRequest'
import { graphQLGetErrors } from '../services/graphQL'
import { selectActiveAccountId } from '../selectors/accounts'
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
  [accountId: string]: PartnerStatsState
}

const defaultAccountState: PartnerStatsAccountState = {
  default: { ...defaultState },
}

// Helper to get partner stats state for a specific account
export function getPartnerStats(state: State, accountId?: string): PartnerStatsState {
  const activeAccountId = selectActiveAccountId(state)
  return state.partnerStats[accountId || activeAccountId] || state.partnerStats.default || defaultState
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
      const accountId = selectActiveAccountId(state)
      dispatch.partnerStats.set({ fetching: true, accountId })
      const response = await graphQLPartnerEntities(accountId)
      if (response !== 'ERROR' && !graphQLGetErrors(response)) {
        const entities = response?.data?.data?.login?.account?.partnerEntities || []
        const flattened = flattenPartners(entities)
        dispatch.partnerStats.set({ all: entities, flattened, initialized: true, accountId })
      }
      dispatch.partnerStats.set({ fetching: false, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const ps = getPartnerStats(state, accountId)
      // Only fetch if not initialized for this account
      if (!ps.initialized) {
        await dispatch.partnerStats.fetch()
      }
    },

    // Set effect that updates state for a specific account
    async set(params: Partial<PartnerStatsState> & { accountId?: string }, state) {
      const accountId = params.accountId || selectActiveAccountId(state)
      const partnerStatsState = { ...getPartnerStats(state, accountId) }

      Object.keys(params).forEach(key => {
        if (key !== 'accountId') {
          partnerStatsState[key] = params[key]
        }
      })

      await dispatch.partnerStats.rootSet({ [accountId]: partnerStatsState })
    },
  }),
  reducers: {
    reset(state: PartnerStatsAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    rootSet(state: PartnerStatsAccountState, params: PartnerStatsAccountState) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

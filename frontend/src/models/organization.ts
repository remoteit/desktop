import { createModel } from '@rematch/core'
import { graphQLSetOrganization, graphQLRemoveOrganization, graphQLSetMembers } from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors } from '../services/graphQL'
import { getRemoteitLicense } from './licensing'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'

export const ROLE: ILookup<string> = {
  OWNER: 'Admin / Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  LIMITED: 'Limited',
}

export type IOrganizationState = {
  id?: string
  name?: string
  created?: Date
  account?: IUserRef
  members: IOrganizationMember[]
  activeId?: string
  initialized: boolean
}

const organizationState: IOrganizationState = {
  id: undefined,
  name: undefined,
  created: undefined,
  members: [],
  activeId: undefined,
  initialized: false,
}

export default createModel<RootModel>()({
  state: organizationState,
  effects: dispatch => ({
    async init() {
      await dispatch.organization.fetch()
      dispatch.organization.set({ initialized: true })
    },

    async fetch() {
      try {
        const result = await graphQLRequest(
          ` query {
              login {
                organization {
                  name
                  id
                  created
                  members {
                    created
                    role
                    license
                    user {
                      id
                      email
                    }
                  }
                }
              }
            }`
        )
        graphQLGetErrors(result)
        await dispatch.organization.parse(result)
      } catch (error) {
        await apiError(error)
      }
    },

    async parse(gqlResponse: AxiosResponse<any> | void, state) {
      if (!gqlResponse) return
      const user = state.auth.user
      const org = gqlResponse?.data?.data?.login?.organization
      console.log('ORGANIZATION DATA', org)

      if (!org || !user) {
        dispatch.organization.clear()
        return
      }

      dispatch.organization.set({
        id: org.id,
        name: org.name,
        created: new Date(org.created),
        members: [
          ...org.members.map(m => ({
            ...m,
            created: new Date(m.created),
          })),
        ],
        access: [],
      })
    },

    async setOrganization(name: string, state) {
      let members = state.organization.members
      dispatch.organization.set({ name: name, id: state.auth.user?.id, members })
      const result = await graphQLSetOrganization(name)
      if (result === 'ERROR') {
        dispatch.organization.fetch()
      } else {
        dispatch.ui.set({ successMessage: `Your organization '${name}' has been set.` })
      }
    },

    async setMembers(members: IOrganizationMember[] = [], state) {
      let updated = [...state.organization?.members]

      members.forEach(m => {
        const index = updated.findIndex(u => u.user.email === m.user.email)
        if (index > -1) updated[index] = m
        else updated.push(m)
      })
      await dispatch.organization.set({ members: updated })

      const action = updated.length > state.organization.members.length ? 'added' : 'updated'
      const result = await graphQLSetMembers(
        members.map(member => member.user.email),
        members[0].role,
        members[0].license
      )
      if (result === 'ERROR') {
        dispatch.organization.fetch()
      } else if (action === 'added') {
        dispatch.ui.set({
          successMessage:
            members.length > 1
              ? `${members.length} members have been ${action}.`
              : `The member '${members[0].user.email}' has been ${action}.`,
        })
      }
    },

    async removeMember(member: IOrganizationMember, state) {
      const result = await graphQLSetMembers([member.user.email], 'REMOVE')
      if (result !== 'ERROR') {
        dispatch.organization.set({
          members: state.organization.members.filter(m => m.user.email !== member.user.email),
        })
        dispatch.ui.set({ successMessage: `Successfully removed ${member?.user?.email}.` })
      }
    },

    async removeOrganization(_, state) {
      const result = await graphQLRemoveOrganization()
      if (result !== 'ERROR') {
        dispatch.organization.clear()
        dispatch.ui.set({ successMessage: `Your organization has been removed.` })
      }
    },
  }),
  reducers: {
    set(state: IOrganizationState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    clear(state: IOrganizationState) {
      state = { ...organizationState, initialized: true }
      return state
    },
    reset(state: IOrganizationState) {
      state = organizationState
      return state
    },
  },
})

export function selectOwner(state: ApplicationState): IOrganizationMember | undefined {
  const user = state.auth.user
  const license = getRemoteitLicense(state)
  return (
    user && {
      created: new Date(user.created || ''),
      role: 'OWNER',
      license: license?.plan.commercial ? 'LICENSED' : 'UNLICENSED',
      organizationId: user.id,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  )
}

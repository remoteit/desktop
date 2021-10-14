import { createModel } from '@rematch/core'
import { graphQLSetOrganization, graphQLSetMembers } from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'

export const ROLE = {
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

      if (!org || !user) return

      const owner = {
        created: new Date(user.created || ''),
        role: 'OWNER',
        organizationId: org.id,
        user: {
          id: user.id,
          email: user.email,
        },
      }

      dispatch.organization.set({
        id: org.id,
        name: org.name,
        created: new Date(org.created),
        members: [
          owner,
          ...org.members.map(m => ({
            ...m,
            created: new Date(m.created),
          })),
        ],
        access: [],
        activeId: undefined,
        initialized: true,
      })
    },

    // async addOrganization(name: string, state) {
    //   try {
    //     const gqlResponse = await graphQLAddOrganization(name)
    //     const result = gqlResponse?.data?.data?.login
    //     const errors = graphQLGetErrors(result)
    //     if (result && !errors?.length) {
    //       analyticsHelper.track('addAccess')
    //       dispatch.organization.set({ name: result.name, id: result.id })
    //       dispatch.ui.set({ successMessage: `Your organization '${name}' has been created.` })
    //     }
    //   } catch (error) {
    //     await apiError(error)
    //   }
    // },

    async setOrganization(name: string, state) {
      dispatch.organization.set({ name })
      const result = await graphQLSetOrganization(name)
      if (result !== 'ERROR') {
        dispatch.organization.set({ name: name, id: state.auth.user?.id })
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

      const action = updated.length > state.organization.members.length ? 'added' : 'updated'
      const result = await graphQLSetMembers(members, members[0].role)
      if (result !== 'ERROR') {
        dispatch.organization.set({ member: updated })
        dispatch.ui.set({
          successMessage:
            members.length > 1
              ? `${members.length} members have been ${action}.`
              : `The member '${members[0].user.email}' has been ${action}.`,
        })
      }
    },

    async removeMember(member: IOrganizationMember, state) {
      const result = await graphQLSetMembers([member], 'REMOVE')
      if (result !== 'ERROR') {
        dispatch.organization.set({
          member: state.organization.members.filter(m => m.user.email !== member.user.email),
        })
        dispatch.ui.set({ successMessage: `Successfully removed ${member?.user?.email}.` })
      }
    },
  }),
  reducers: {
    set(state: IOrganizationState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    reset(state: IOrganizationState) {
      state = organizationState
      return state
    },
  },
})

import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLSetOrganization, graphQLSetMembers, graphQLAddMembers } from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

export const ROLE = {
  OWNER: 'Admin / Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  GUEST: 'Guest',
}

export type IOrganizationState = {
  id?: string
  name?: string
  created?: Date
  member: IOrganizationMember[] // members of this org
  access: IOrganizationMember[] // orgs you belong too
  activeId?: string
}

const organizationState: IOrganizationState = {
  id: undefined,
  name: undefined,
  created: undefined,
  member: [],
  access: [],
  activeId: undefined,
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
                    organization {
                      id
                      name
                    }
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
        await graphQLCatchError(error)
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
        member: [owner, ...org.members],
        access: [],
        activeId: undefined,
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
    //     await graphQLCatchError(error)
    //   }
    // },

    async setOrganization(name: string, state) {
      dispatch.organization.set({ name })
      const gqlResponse = await graphQLSetOrganization(name)
      const result = gqlResponse?.data?.data?.updateOrganization
      if (result) {
        dispatch.organization.set({ name: result.name, id: result.id })
        dispatch.ui.set({ successMessage: `Your organization '${name}' has been set.` })
      }
    },

    async setMembers(members: IOrganizationMember[] = [], state) {
      let updated = [...state.organization.member]
      members.forEach(m => {
        const index = updated.findIndex(u => u.user.email === m.user.email)
        if (index > -1) updated[index] = m
        else updated.push(m)
      })

      console.log('UPDATE MEMBERS', updated)
      dispatch.organization.set({ member: updated })

      console.log('NEW MEMBER?', updated.length, '>', state.organization.member.length)

      if (updated.length > state.organization.member.length) {
        await graphQLAddMembers(members[0])
        dispatch.ui.set({ successMessage: `The member '${members[0].user.email}' has been added.` })
      } else {
        await graphQLSetMembers(members[0])
        dispatch.ui.set({ successMessage: `The member '${members[0].user.email}' has been updated.` })
      }
    },

    async removeAccess(email: string, state) {
      // const { access } = state.accounts as ApplicationState['accounts']
      // try {
      //   const result = await graphQLLinkAccount([email], 'REMOVE')
      //   const errors = graphQLGetErrors(result)
      //   if (!errors?.length) {
      //     analyticsHelper.track('removedAccess')
      //     dispatch.organization.set({ access: access.filter(user => user.email !== email) })
      //     dispatch.ui.set({ successMessage: `${email} successfully removed.` })
      //   }
      // } catch (error) {
      //   await graphQLCatchError(error)
      // }
    },
    async leaveMembership(email: string, state) {
      // const { member } = state.accounts as ApplicationState['accounts']
      // try {
      //   const result = await graphQLLinkAccount([email], 'LEAVE')
      //   const errors = graphQLGetErrors(result)
      //   if (!errors?.length) {
      //     analyticsHelper.track('leaveMembership')
      //     dispatch.organization.set({ member: member.filter(user => user.email !== email) })
      //     dispatch.ui.set({ successMessage: `You have successfully left ${email}'s device list.` })
      //   }
      // } catch (error) {
      //   await graphQLCatchError(error)
      // }
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

export function getAllDevices(state: ApplicationState): IDevice[] {
  return (
    Object.keys(state.devices.all).reduce(
      (all: IDevice[], accountId) => all.concat(state.devices.all[accountId]),
      []
    ) || []
  )
}

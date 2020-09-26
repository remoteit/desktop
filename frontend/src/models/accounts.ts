import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLLinkAccount } from '../services/graphQLMutation'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'

type IUserState = ILookup & {
  member: IUser[]
  access: IUser[]
}

type IGraphQLAccount = {
  scripting: boolean
  created: Date
  user: {
    email: string
  }
}

const state: IUserState = {
  member: [],
  access: [],
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async parse(gqlData?: { member: IGraphQLAccount[]; access: IGraphQLAccount[] }) {
      if (!gqlData) return
      const { parseAccounts } = dispatch.accounts
      dispatch.accounts.set({
        member: await parseAccounts(gqlData.member),
        access: await parseAccounts(gqlData.access),
      })
    },
    async parseAccounts(accounts: IGraphQLAccount[]): Promise<IUser[]> {
      return accounts.map(a => ({
        scripting: a.scripting,
        created: new Date(a.created),
        email: a.user.email,
      }))
    },
    async addAccess(emails: string[], globalState) {
      const { access } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount(emails, 'ADD')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          dispatch.accounts.set({ access: [...access, ...emails.map(email => ({ email, created: new Date() }))] })
          dispatch.ui.set({
            successMessage:
              emails.length > 1
                ? `Accounts successfully linked: ${emails.join(', ')}`
                : `${emails[0]} successfully linked.`,
          })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async removeAccess(email: string, globalState) {
      const { access } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'REMOVE')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          dispatch.accounts.set({ access: access.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `${email} successfully removed.` })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async leaveMembership(email: string, globalState) {
      const { member } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'LEAVE')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          dispatch.accounts.set({ member: member.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `You successfully left ${email}'s account.` })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
  }),
  reducers: {
    set(state: IUserState, params: ILookup) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})

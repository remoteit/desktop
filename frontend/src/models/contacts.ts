import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { graphQLBasicRequest } from '../services/graphQL'
import { RootModel } from './rootModel'

type IContactsState = {
  all: IUserRef[]
}

const defaultState: IContactsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch() {
      const result = await graphQLBasicRequest(
        ` query {
            login {
              contacts {
                id
                email
              }
            }
          }`
      )
      if (result === 'ERROR') return
      const all = await dispatch.contacts.parse(result)
      dispatch.contacts.set({ all })
    },

    async parse(result: AxiosResponse<any> | undefined) {
      return result?.data?.data?.login?.contacts
    },
  }),

  reducers: {
    reset(state: IContactsState) {
      state = { ...defaultState }
      return state
    },
    set(state: IContactsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function contactOptions(all: IUser[]): IReactSelectOption[] {
  if (!all.length) return []

  const selectedEmails: any[] = []

  return all.map(c => ({
    value: c.email,
    label: c.email,
    isDisabled: selectedEmails.includes(c.email),
  }))
}

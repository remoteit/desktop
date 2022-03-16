import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { graphQLBasicRequest } from '../services/graphQL'
import { graphQLCreateAccessKey, graphQLDeleteAccessKeys, graphQLToggleAccessKeys } from '../services/graphQLAccessKeys'
import { RootModel } from './rootModel'

type IKeysState = {
  init: boolean
  updating?: string
  accessKeys: IAccessKey[]
  secretKey?: string
  apiKey?: string
  key?: string
}

const defaultState: IKeysState = {
  init: false,
  updating: undefined,
  accessKeys: [],
  secretKey: undefined,
  apiKey: undefined,
  key: undefined,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_, globalState) {
      if (globalState.keys.init) return
      await dispatch.keys.fetch()
      dispatch.keys.set({ init: true })
    },
    async fetch() {
      const result = await graphQLBasicRequest(
        ` query {
            login {
              apiKey {
                key
                updated
              }
              accessKeys {
                key
                enabled
                created
                lastUsed
              }          
            }
          }`
      )
      if (result === 'ERROR') return
      const { apiKey, accessKeys } = await dispatch.keys.parse(result)
      dispatch.keys.set({ apiKey, accessKeys })
    },
    async parse(result: AxiosResponse<any> | undefined, globalState) {
      const data = result?.data?.data?.login
      const parsed = {
        apiKey: data?.apiKey?.key,
        accessKeys: data?.accessKeys?.map(k => ({
          ...k,
          created: new Date(k.created),
          lastUsed: k.lastUsed && new Date(k.lastUsed),
        })),
      }
      return parsed
    },
    async toggleAccessKeys(properties: { key: string; enabled: boolean }) {
      dispatch.keys.set({ updating: properties.key })
      const result = await graphQLToggleAccessKeys(properties)
      if (result === 'ERROR') return
      await dispatch.keys.fetch()
      dispatch.keys.set({ updating: undefined })
    },
    async deleteAccessKeys(key: string) {
      dispatch.keys.set({ updating: key })
      const result = await graphQLDeleteAccessKeys(key)
      if (result === 'ERROR') return
      await dispatch.keys.fetch()
      dispatch.keys.set({ updating: undefined })
    },
    async createAccessKey() {
      const result = await graphQLCreateAccessKey()
      if (result === 'ERROR') return
      const data = result?.data.data.createAccessKey
      await dispatch.keys.set({ key: data.key, secretKey: data.secret })
      dispatch.keys.fetch()
    },
  }),
  reducers: {
    reset(state: IKeysState) {
      state = { ...defaultState }
      return state
    },
    set(state: IKeysState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

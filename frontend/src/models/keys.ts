import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import {
  graphQLGetAccessKeys,
  graphQLCreateAccessKey,
  graphQLDeleteAccessKeys,
  graphQLToggleAccessKeys,
} from '../services/graphQLAccessKeys'
import { RootModel } from '.'

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
    async init(_: void, globalState) {
      if (globalState.keys.init) return
      if (await dispatch.keys.fetch()) dispatch.keys.set({ init: true })
    },
    async fetch() {
      const result = await graphQLGetAccessKeys()
      if (!result || result === 'ERROR') return false
      const { apiKey, accessKeys } = await dispatch.keys.parse(result)
      dispatch.keys.set({ apiKey, accessKeys })
      return true
    },
    async parse(result: AxiosResponse<any>) {
      const data = result.data?.data?.login
      const parsed = {
        apiKey: data?.apiKey?.key,
        accessKeys: data?.accessKeys?.map(k => ({
          ...k,
          created: new Date(k.created),
          lastUsed: k.lastUsed && new Date(k.lastUsed),
        })) ?? [],
      }
      return parsed
    },
    async toggleAccessKeys(properties: { key: string; enabled: boolean }) {
      dispatch.keys.set({ updating: properties.key })
      const result = await graphQLToggleAccessKeys(properties)
      if (result !== 'ERROR') await dispatch.keys.fetch()
      dispatch.keys.set({ updating: undefined })
    },
    async deleteAccessKeys(key: string) {
      dispatch.keys.set({ updating: key })
      const result = await graphQLDeleteAccessKeys(key)
      if (result !== 'ERROR') await dispatch.keys.fetch()
      dispatch.keys.set({ updating: undefined })
    },
    async createAccessKey() {
      const result = await graphQLCreateAccessKey()
      const data = result && result !== 'ERROR' && result.data?.data?.createAccessKey
      if (!data) return false
      await dispatch.keys.set({ key: data.key, secretKey: data.secret })
      dispatch.keys.fetch()
      return true
    },
  }),
  reducers: {
    reset(state: IKeysState) {
      state = { ...defaultState }
      return state
    },
    set(state: IKeysState, params: Partial<IKeysState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

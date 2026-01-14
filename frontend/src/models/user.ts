import axios, { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { API_URL, DEVELOPER_KEY, LANGUAGES } from '../constants'
import { graphQLNotificationSettings, graphQLSetAttributes, graphQLLeaveReseller } from '../services/graphQLMutation'
import { graphQLUser } from '../services/graphQLRequest'
import { RootModel } from '.'
import { getToken } from '../services/remoteit'

type IUserState = {
  id: string
  email: string
  created: Date
  notificationSettings: INotificationSetting
  reseller: IResellerRef | null
  language: string
  attributes: ILookup<any>
  admin: boolean
}

const defaultState: IUserState = {
  id: '',
  email: '',
  created: new Date(0),
  notificationSettings: {},
  reseller: null,
  language: 'en',
  attributes: {},
  admin: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      const account = state.auth.user?.id
      if (!account) return
      const result = await graphQLUser(account)
      if (result === 'ERROR') return
      const data = await dispatch.user.parse(result)
      if (data) dispatch.user.set(data)
    },
    async parse(result: AxiosResponse<any> | undefined) {
      const data = result?.data?.data?.login?.account
      console.log('USER DATA', data)
      return {
        ...data,
        created: new Date(data?.created),
        attributes: data?.attributes?.$remoteit,
      }
    },
    async leaveReseller() {
      const result = await graphQLLeaveReseller()
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Failed to leave reseller' })
        return
      }
      await dispatch.user.fetch()
      await dispatch.organization.fetch()
    },
    async setAttribute(attribute: ILookup<any>, state) {
      dispatch.user.set({ attributes: { ...state.user.attributes, ...attribute } })
      await graphQLSetAttributes(attribute)
    },
    async updateNotificationSettings(metadata: INotificationSetting) {
      const result = await graphQLNotificationSettings(metadata)
      if (result === 'ERROR') return
      dispatch.user.set({ notificationSettings: metadata })
    },
    async changeLanguage(language: string) {
      await axios.post(
        '/user/language/',
        { language },
        {
          baseURL: API_URL,
          headers: {
            'Content-Type': 'application/json',
            developerKey: DEVELOPER_KEY,
            Authorization: await getToken(),
          },
        }
      )
      dispatch.ui.set({ successMessage: `Language changed to ${LANGUAGES[language]}` })
      dispatch.user.set({ language })
    },
  }),
  reducers: {
    reset(state: IUserState) {
      state = { ...defaultState }
      return state
    },
    set(state: IUserState, params: Partial<IUserState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

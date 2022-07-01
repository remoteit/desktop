import { LANGUAGES } from '../shared/constants'
import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { graphQLNotificationSettings, graphQLSetAttributes } from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { RootModel } from '.'
import { r3 } from '../services/remote.it'

type IUserState = {
  id: string
  email: string
  notificationSettings: INotificationSetting
  language: string
  attributes: ILookup<any>
}

const defaultState: IUserState = {
  id: '',
  email: '',
  notificationSettings: {},
  language: 'en',
  attributes: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_, state) {
      const account = state.auth.user?.id
      const result = await graphQLBasicRequest(
        ` query($account: String) {
            login {
              account(id: $account) {
                id
                email
                language
                created
                notificationSettings {
                  emailNotifications
                  desktopNotifications
                  urlNotifications
                  notificationEmail
                  notificationUrl
                }
                attributes
              }
            }
          }`,
        { account }
      )
      if (result === 'ERROR') return
      const data = await dispatch.user.parse(result)
      if (data) dispatch.user.set(data)
    },
    async parse(result: AxiosResponse<any> | undefined) {
      const data = result?.data?.data?.login?.account
      console.log('USER DATA', data)
      return {
        ...data,
        attributes: data?.attributes?.$remoteit,
      }
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
      await r3.post('/user/language/', { language }) // fixme - use axios
      dispatch.ui.set({ successMessage: `Language changed to ${LANGUAGES[language]}` })
      dispatch.user.set({ language })
    },
  }),
  reducers: {
    reset(state: IUserState) {
      state = { ...defaultState }
      return state
    },
    set(state: IUserState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { graphQLBasicRequest } from '../services/graphQL'
import { RootModel } from '.'

type IBilling = {
  invoices: IInvoice[]
  loading: boolean
}

const defaultState: IBilling = {
  invoices: [],
  loading: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch() {
      dispatch.billing.set({ loading: true })
      const result = await graphQLBasicRequest(
        ` {
            login {
              invoices {
                plan {
                  name
                }
                quantity
                price {
                  id
                  amount
                  currency
                  interval
                }
                total
                paid
                url
                created
              }
            }
          }`
      )
      if (result === 'ERROR') return
      dispatch.billing.parse(result)
      dispatch.billing.set({ loading: false })
    },
    async parse(result: AxiosResponse<any> | undefined) {
      if (!result) return
      const invoices = result?.data?.data?.login?.invoices
      console.log('LICENSING', result)
      dispatch.billing.set({
        invoices: invoices.map(i => ({
          ...i,
          created: new Date(i.created),
        })),
      })
    },
  }),
  reducers: {
    reset(state: IBilling) {
      state = { ...defaultState }
      return state
    },
    set(state: IBilling, params: Partial<IBilling>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

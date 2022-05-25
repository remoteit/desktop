import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
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
      try {
        const result: any = await graphQLRequest(
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
        graphQLGetErrors(result)
        dispatch.billing.parse(result)
      } catch (error) {
        await apiError(error)
      }
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
    set(state: IBilling, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

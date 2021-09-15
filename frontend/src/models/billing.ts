import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { RootModel } from './rootModel'

type IBilling = {
  invoices: IInvoice[]
  loading: boolean
}

const defaultState: IBilling = {
  invoices: [],
  loading: false,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
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
        dispatch.billing.parse(result?.data?.data)
      } catch (error) {
        await graphQLCatchError(error)
      }
      dispatch.billing.set({ loading: false })
    },
    async parse(data: any) {
      if (!data) return
      console.log('LICENSING', data)
      dispatch.billing.set({
        invoices: data?.login.invoices.map(i => ({
          ...i,
          created: new Date(i.created),
        })),
      })
    },
  }),
  reducers: {
    reset(state: IBilling) {
      state = defaultState
      return state
    },
    set(state: IBilling, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

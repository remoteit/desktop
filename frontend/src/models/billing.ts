import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'

type IBilling = {
  cards: ICreditCard[]
  invoices: IInvoice[]
}

const defaultState: IBilling = {
  cards: [],
  invoices: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
    async fetch() {
      try {
        const result: any = await graphQLRequest(
          ` {
              login {
                email
                billing {
                  cards {
                    id
                    brand
                    month
                    year
                    last
                  }
                  invoices {
                    id
                    plan {
                      description
                      duration
                      id
                      name
                    }
                    quantity
                    total
                    currency
                    paid
                    url
                    date
                  }
                }
              }
            }`
        )
        graphQLGetErrors(result)
        dispatch.billing.parse(result?.data?.data?.login?.billing)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async parse(data: any) {
      if (!data) return
      console.log('BILLING', data)
      dispatch.billing.set({
        cards: data.cards,
        invoices: data.invoices.map(i => ({
          ...i,
          date: new Date(i.date),
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

// export function getLicenses(state: ApplicationState) {
//   let licenses: ILicense[]
//   if (state.billing.tests.license) licenses = state.billing.tests.licenses
//   else licenses = state.billing.licenses
//   return licenses
// }

import { REMOTEIT_PRODUCT_ID } from './licensing'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { graphQLPurchase } from '../services/graphQLMutation'
import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'

const PERSONAL_PLAN = {
  name: 'PERSONAL',
  description: 'personal',
  product: {
    id: REMOTEIT_PRODUCT_ID,
    name: 'remote.it',
    description: 'remote.it',
  },
  prices: [],
}

type IBilling = {
  purchasing: boolean
  subscription?: ISubscription
  plans: IPlan[]
  cards: ICreditCard[]
  invoices: IInvoice[]
}

const defaultState: IBilling = {
  purchasing: false,
  subscription: undefined,
  plans: [],
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
                  subscription {
                    id
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
                    status
                    created
                    expiration
                  }
                  plans {
                    id
                    name
                    description
                    product {
                      id
                      name
                      description
                    }
                    prices {
                      id
                      amount
                      currency
                      interval
                    }
                  }
                  card {
                    id
                    brand
                    month
                    year
                    last
                  }
                  invoices {
                    id
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
        subscription: data.subscription,
        plans: data.plans,
        cards: data.cards,
        invoices: data.invoices.map(i => ({
          ...i,
          created: new Date(i.created),
        })),
      })
    },
    async purchase(form: IPurchase) {
      dispatch.billing.set({ purchasing: true })

      const response = await graphQLPurchase(form)
      const checkout = response?.data?.data?.updateSubscription

      console.log('PURCHASE', checkout)
      if (checkout?.url) window.location.href = checkout.url

      dispatch.billing.set({ purchasing: false })
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

export function selectPlans(state: ApplicationState, productId: string) {
  let plans = state.billing.plans.filter(p => p.product.id === productId)
  plans.unshift(PERSONAL_PLAN)
  return plans
}

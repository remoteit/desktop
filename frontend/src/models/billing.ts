/* import { Stripe, loadStripe } from '@stripe/stripe-js'
import { REMOTEIT_PRODUCT_ID } from './licensing'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { graphQLSubscribe, graphQLUnsubscribe } from '../services/graphQLMutation'
import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'

type IBilling = {
  purchasing: boolean
  stripePromise: Promise<Stripe | null> | null
  subscription?: ISubscription
  plans: IPlan[]
  card?: ICreditCard
  all: IInvoice[]
}

const defaultState: IBilling = {
  // purchasing: false,
  // subscription: undefined,
  // plans: [],
  // card: undefined,
  all: [],
  stripePromise: null,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
    async init() {
      // const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_API_KEY || 'pk_live_ozbaGu05Knz2IsMEkvU1ZRr6')
      // dispatch.billing.set({ stripePromise })
      await dispatch.billing.fetch()
    },
    async fetch() {
      try {
        const result: any = await graphQLRequest(
          ` {
              login {
                email      
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
        dispatch.billing.parse(result?.data?.data?.login?.invoices)
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
    // async purchase(form: IPurchase) {
    //   dispatch.billing.set({ purchasing: true })

    //   if (!form.planId) {
    //     await graphQLUnsubscribe(form)
    //     console.log('CANCEL PLAN')
    //   } else {
    //     const response = await graphQLSubscribe(form)
    //     const checkout = response?.data?.data?.updateSubscription
    //     console.log('PURCHASE', checkout)
    //     if (checkout?.url) window.location.href = checkout.url
    //   }

    //   await dispatch.billing.fetch()
    //   dispatch.billing.set({ purchasing: false })
    // },
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
  // return state.billing.plans.filter(p => p.product.id === productId)
}
 */

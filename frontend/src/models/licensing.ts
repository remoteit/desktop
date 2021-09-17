import { Duration } from 'luxon'
import { testData } from '../test/licensing'
import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import {
  graphQLSubscribe,
  graphQLUnsubscribe,
  graphQLUpdateSubscription,
  graphQLCreditCard,
} from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number; managePath: string }

export const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
export const AWS_PRODUCT_ID = '55d9e884-05fd-11eb-bda8-021f403e8c27'
export const PERSONAL_PLAN_ID = 'e147a026-81d7-11eb-afc8-02f048730623'

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: REMOTEIT_PRODUCT_ID,
    platform: undefined,
    managePath: '/settings/plans',
  },
  {
    productId: AWS_PRODUCT_ID,
    platform: 1185,
    managePath: '/settings/plans',
  },
]

const defaultLicense = LicenseLookup[0]

type ILicensing = {
  initialized: boolean
  plans: IPlan[]
  licenses: ILicense[]
  limits: ILimit[]
  updating?: string
  purchasing?: string
  informed: boolean
  tests: {
    license: boolean
    limit: boolean
    unlicensed: boolean
    licenses: ILicense[]
    limits: ILimit[]
  }
}

const defaultState: ILicensing = {
  initialized: false,
  plans: [],
  licenses: [],
  limits: [],
  updating: undefined,
  purchasing: undefined,
  informed: false,
  tests: testData,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
    async init() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ initialized: true })
    },

    async restore(_, globalState) {
      const license = getRemoteitLicense(globalState)
      const last = license?.subscription?.card?.last
      const planId = license?.plan.id

      console.log('INIT LICENSING', {
        last,
        lastStored: localStorage.getItem('licencing.updating'),
        planId,
        planIdStored: localStorage.getItem('licencing.purchasing'),
      })

      dispatch.licensing.set({
        purchasing: localStorage.getItem('licencing.purchasing') !== planId ? planId : undefined,
        updating: localStorage.getItem('licensing.updating') === last ? last : undefined,
      })
    },
    async fetch() {
      const graphQLLicense = `
        id
        updated
        created
        expiration
        valid
        quantity
        plan {
          id
          name
          description
          duration
          commercial
          billing
          product {
            id
            name
            description
          }
        }
        subscription {
          total
          status
          price {
            id
            amount
            currency
            interval
          }
          card {
            brand
            month
            year
            last
            name
            email
            phone
            postal
            country
            expiration
          }
        }
  `

      try {
        const result: any = await graphQLRequest(
          ` {
              plans {
                id
                name
                description
                product {
                  id
                }
                prices {
                  id
                  amount
                  currency
                  interval
                }
              }          
              login {
                licenses {
                  ${graphQLLicense}
                }
                limits {
                  name
                  value
                  actual
                  license {
                    id
                  }
                }
              }
            }`
        )
        graphQLGetErrors(result)
        dispatch.licensing.parse(result?.data?.data)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },

    async parse(data: any) {
      if (!data) return
      console.log('LICENSING', data)
      dispatch.licensing.set({
        plans: data.plans,
        licenses: data?.login.licenses.map(l => parseLicense(l)),
        limits: data?.login.limits,
        purchasing: undefined,
        updating: undefined,
      })
    },

    async subscribe(form: IPurchase) {
      dispatch.licensing.set({ purchasing: form.planId })
      localStorage.setItem('licencing.purchasing', form.planId || '')
      const response = await graphQLSubscribe(form)
      const checkout = response?.data?.data?.createSubscription
      console.log('PURCHASE', checkout)
      if (checkout?.url) window.location.href = checkout.url
    },

    async updateSubscription({ priceId, quantity }: IPurchase) {
      if (!priceId) return dispatch.ui.set({ errorMessage: `Plan selection incomplete (${priceId})` })
      dispatch.licensing.set({ purchasing: 'true' })
      await graphQLUpdateSubscription({ priceId, quantity })
      console.log('UPDATE SUBSCRIPTION', { priceId, quantity })
    },

    async unsubscribe() {
      dispatch.licensing.set({ purchasing: 'true' })
      await graphQLUnsubscribe()
      console.log('UNSUBSCRIBE')
    },

    async updateCreditCard(last: string | undefined, globalState) {
      dispatch.licensing.set({ updating: last || true })
      localStorage.setItem('licensing.updating', last || '')
      const response = await graphQLCreditCard()
      const result = response?.data?.data?.updateCreditCard
      console.log('UPDATE CREDIT CARD', result)
      if (result?.url) window.location.href = result.url
    },

    async updated() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ purchasing: undefined, updating: undefined })
    },

    async testServiceLicensing(_, globalState) {
      const states = ['UNKNOWN', 'EVALUATION', 'LICENSED', 'UNLICENSED', 'NON_COMMERCIAL', 'LEGACY']
      const devices = getDevices(globalState)
      const updated = devices.map((device, index) => ({
        ...device,
        services: device.services.map(service => ({
          ...service,
          license: states[index % 6],
        })),
      }))
      dispatch.accounts.setDevices({ devices: updated })
    },

    async testClearLicensing() {
      dispatch.licensing.set({
        licenses: [],
        limits: [],
      })
    },
  }),
  reducers: {
    reset(state: ILicensing) {
      state = defaultState
      return state
    },
    set(state: ILicensing, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function parseLicense(data) {
  if (!data) return null
  return {
    ...data,
    created: new Date(data.created),
    updated: new Date(data.updated),
    expiration: data.expiration && new Date(data.expiration),
    subscription: data.subscription && {
      ...data.subscription,
      card: data.subscription.card && {
        ...data.subscription.card,
        expiration: data.subscription.card.expiration && new Date(data.subscription.card.expiration),
      },
    },
  }
}

export function getRemoteitLicense(state: ApplicationState) {
  return getLicenses(state).find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
}

export function getLicenses(state: ApplicationState) {
  let licenses: ILicense[]
  if (state.licensing.tests.license) licenses = state.licensing.tests.licenses
  else licenses = state.licensing.licenses
  return licenses
}

export function getLimits(state: ApplicationState) {
  if (state.licensing.tests.limit) return state.licensing.tests.limits
  else return state.licensing.limits
}

export function lookupLicensemanagePath(productId?: string) {
  let lookup = LicenseLookup.find(l => l.productId === productId)
  if (!lookup) lookup = defaultLicense
  return lookup.managePath
}

export function lookupLicenseProductId(device?: IDevice) {
  let lookup = LicenseLookup.find(l => l.platform === device?.targetPlatform)
  if (!lookup) lookup = defaultLicense
  return lookup.productId
}

export function selectLicense(state: ApplicationState, productId?: string) {
  const license = getLicenses(state).find(l => l.plan.product.id === productId)
  const limits = getLimits(state)
  const informed = state.licensing.informed

  const serviceLimit = limits.find(l => l.name === 'aws-services')
  const evaluationLimit = limits.find(l => l.name === 'aws-evaluation')
  const managePath = lookupLicensemanagePath(productId)

  if (!license) return {}

  let noticeType
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 3) // warn 3 days in advance

  if (license.expiration && warnDate > license.expiration && license.plan.name === 'TRIAL')
    noticeType = 'EXPIRATION_WARNING'
  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value) noticeType = 'LIMIT_EXCEEDED'
  if (!license.valid) noticeType = 'EXPIRED'

  return {
    noticeType,
    license,
    informed,
    limits,
    serviceLimit,
    evaluationLimit,
    managePath,
  }
}

export function selectLicenses(state: ApplicationState) {
  return {
    licenses: getLicenses(state).map(license => ({
      ...license,
      managePath: lookupLicensemanagePath(license.plan.product.id),
      limits: getLimits(state).filter(limit => limit.license?.id === license.id),
    })),
    limits: getLimits(state).filter(limit => !limit.license),
  }
}

export function selectLicenseIndicator(state: ApplicationState) {
  const { informed } = state.licensing
  if (informed) return 0
  let indicators = 0
  const { licenses } = selectLicenses(state)
  for (var license of licenses) {
    const { noticeType } = selectLicense(state, license?.plan.product.id)
    if (noticeType) indicators++
  }
  return indicators
}

export function limitDays(value?: string) {
  if (value) {
    return Duration.fromISO(value).as('days')
  }
  return 0
}

export function humanizeDays(value?: string) {
  const milliseconds = limitDays(value) * 8.64e7
  return humanize(milliseconds, { round: true, largest: 1 })
}

export function getLogLimit(state: ApplicationState) {
  return getLimits(state).find(limit => limit.name === 'log-limit')?.value || 'P1W'
}

import { Duration } from 'luxon'
import { testData } from '../test/licensing'
import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { ApplicationState } from '../store'
import {
  graphQLSubscribe,
  graphQLUnsubscribe,
  graphQLUpdateSubscription,
  graphQLCreditCard,
} from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number; managePath: string }

export const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
export const AWS_PRODUCT_ID = '55d9e884-05fd-11eb-bda8-021f403e8c27'
export const PERSONAL_PLAN_ID = 'e147a026-81d7-11eb-afc8-02f048730623'
export const PROFESSIONAL_PLAN_ID = '6b5e1e70-045d-11ec-8a08-02ea65a4da2d'
export const BUSINESS_PLAN_ID = '85ce6edf-9e70-11ec-b51a-0a63867cb0b9'

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

export const graphQLLicenses = `
  licenses {
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
  }`

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
  state: { ...defaultState },
  effects: dispatch => ({
    async init() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ initialized: true })
    },

    async restore(_, globalState) {
      const license = getRemoteitLicense(globalState)
      const last = license?.subscription?.card?.last
      const planId = license?.plan.id

      dispatch.licensing.set({
        purchasing: localStorage.getItem('licensing.purchasing') !== planId ? planId : undefined,
        updating: localStorage.getItem('licensing.updating') === last ? last : undefined,
      })
    },
    async fetch() {
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
                ${graphQLLicenses}
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
        await dispatch.licensing.parse(result)
        await dispatch.licensing.limitFeatures()
      } catch (error) {
        await apiError(error)
      }
    },

    async parse(gqlResponse: AxiosResponse<any> | void, state) {
      if (!gqlResponse) return
      const data = gqlResponse?.data?.data
      await dispatch.licensing.set({
        plans: data.plans,
        licenses: data?.login.licenses.map(l => parseLicense(l)),
        limits: data?.login.limits,
        purchasing: undefined,
        updating: undefined,
      })
      console.log('LICENSING', data)
    },

    async limitFeatures(_, globalState) {
      const limits = getLimits(globalState)
      const feature = { ...globalState.ui.feature }
      limits.forEach(l => {
        if (feature[l.name] !== undefined) feature[l.name] = l.value
      })
      dispatch.ui.set({ feature })
    },

    async subscribe(form: IPurchase, globalState) {
      dispatch.licensing.set({ purchasing: form.planId })
      localStorage.setItem('licensing.purchasing', form.planId || '')

      const license = getRemoteitLicense(globalState)
      if (license?.subscription) {
        await dispatch.licensing.unsubscribe(form.planId)
      }
      const result = await graphQLSubscribe(form)
      if (result !== 'ERROR') {
        const checkout = result?.data?.data?.createSubscription
        console.log('PURCHASE', checkout)
        if (checkout?.url) window.location.href = checkout.url
        else {
          dispatch.ui.set({ errorMessage: 'Error purchasing license' })
          dispatch.licensing.set({ purchasing: undefined })
        }
      }
    },

    async updateSubscription({ priceId, planId, quantity }: IPurchase) {
      if (!priceId) {
        dispatch.ui.set({ errorMessage: `Plan selection incomplete (${priceId})` })
        return
      }
      dispatch.licensing.set({ purchasing: planId })
      const result = await graphQLUpdateSubscription({ priceId, quantity })
      if (result !== 'ERROR') {
        const success = result?.data?.data?.updateSubscription
        if (!success) {
          dispatch.ui.set({ errorMessage: 'Subscription update failed, please contact support.' })
          dispatch.licensing.set({ purchasing: undefined })
        }
      }
      await dispatch.organization.fetch()
      setTimeout(() => dispatch.licensing.set({ purchasing: undefined }), 30 * 1000)
      console.log('UPDATE SUBSCRIPTION', { priceId, quantity, result })
    },

    async unsubscribe(planId: string | undefined) {
      dispatch.licensing.set({ purchasing: planId })
      await graphQLUnsubscribe()
      dispatch.devices.fetch()
      console.log('UNSUBSCRIBE')
    },

    async updateCreditCard(last: string | undefined) {
      dispatch.licensing.set({ updating: last || true })
      localStorage.setItem('licensing.updating', last || '')
      const result = await graphQLCreditCard()
      if (result !== 'ERROR') {
        const card = result?.data?.data?.updateCreditCard
        console.log('UPDATE CREDIT CARD', card)
        if (card?.url) window.location.href = card.url
      }
    },

    async updated() {
      await dispatch.licensing.fetch()
      dispatch.licensing.set({ purchasing: undefined, updating: undefined })
      dispatch.ui.set({ successMessage: 'Subscription updated.' })
    },

    async testServiceLicensing(_, globalState) {
      const states: ILicenseTypes[] = [
        'UNKNOWN',
        'EVALUATION',
        'LICENSED',
        'UNLICENSED',
        'NON_COMMERCIAL',
        'EXEMPT',
        'LEGACY',
      ]
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
      state = { ...defaultState }
      return state
    },
    set(state: ILicensing, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function parseLicense(data) {
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

export function getRemoteitLicense(state: ApplicationState): ILicense | null {
  return getLicenses(state).find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
}

export function getLicenses(state: ApplicationState) {
  let licenses: ILicense[]
  if (state.licensing.tests.license) licenses = state.licensing.tests.licenses
  else licenses = state.licensing.licenses
  return licenses
}

export function getFreeLicenses(state: ApplicationState) {
  const purchased = getRemoteitLicense(state)?.quantity || 0
  const used = 1 + state.organization.members.reduce((sum, m) => sum + (m.license === 'LICENSED' ? 1 : 0), 0)
  return Math.max(purchased - used, 0)
}

export function getLimits(state: ApplicationState) {
  if (state.licensing.tests.limit) return state.licensing.tests.limits
  else return state.licensing.limits
}

export function getLimit(name: string, state: ApplicationState) {
  return getLimits(state).find(limit => limit.name === name)?.value
}

export function getInformed(state: ApplicationState) {
  return state.licensing.tests.limit ? false : state.licensing.informed
}

export function lookupLicenseManagePath(productId?: string) {
  let lookup = LicenseLookup.find(l => l.productId === productId)
  if (!lookup) lookup = defaultLicense
  return lookup.managePath
}

export function lookupLicenseProductId(device?: IDevice) {
  let lookup = LicenseLookup.find(l => l.platform === device?.targetPlatform)
  if (!lookup) lookup = defaultLicense
  return lookup.productId
}

export function selectLicense(
  state: ApplicationState,
  { productId, license }: { productId?: string; license?: ILicense }
) {
  license = license || getLicenses(state).find(l => l.plan.product.id === productId)
  const limits = getLimits(state)
  const informed = getInformed(state)

  const serviceLimit = limits.find(l => l.name === 'aws-services')
  const evaluationLimit = limits.find(l => l.name === 'aws-evaluation')
  const managePath = lookupLicenseManagePath(productId)

  if (!license) return {}
  let noticeType: string = license.subscription?.status || ''
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

export function selectLicenses(state: ApplicationState): { licenses: ILicense[]; limits: ILimit[] } {
  return {
    licenses: getLicenses(state).map(license => ({
      ...license,
      managePath: lookupLicenseManagePath(license.plan.product.id),
      limits: getLimits(state).filter(limit => limit.license?.id === license.id),
    })),
    limits: getLimits(state).filter(limit => !limit.license),
  }
}

export function selectLicenseIndicator(state: ApplicationState) {
  const informed = getInformed(state)
  if (informed) return 0
  let indicators = 0
  const { licenses } = selectLicenses(state)
  for (var license of licenses) {
    const { noticeType } = selectLicense(state, { license })
    if (noticeType && noticeType !== 'ACTIVE') indicators++
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

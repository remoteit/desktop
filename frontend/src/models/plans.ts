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
import { graphQLBasicRequest } from '../services/graphQL'
import { getDevices } from './accounts'
import { getOrganization } from './organization'
import { RootModel } from '.'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number; managePath: string }

const PURCHASING_PLAN = 'plans.purchasing'
const UPDATING_PLAN = 'plans.updating'

export const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
export const AWS_PRODUCT_ID = '55d9e884-05fd-11eb-bda8-021f403e8c27'
export const PERSONAL_PLAN_ID = 'e147a026-81d7-11eb-afc8-02f048730623'
export const PROFESSIONAL_PLAN_ID = '6b5e1e70-045d-11ec-8a08-02ea65a4da2d'
export const BUSINESS_PLAN_ID = '85ce6edf-9e70-11ec-b51a-0a63867cb0b9'
export const ENTERPRISE_PLAN_ID = 'b44f92a6-a7b9-11eb-b094-02a962787033'

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: REMOTEIT_PRODUCT_ID,
    platform: undefined,
    managePath: '/account/plans',
  },
  {
    productId: AWS_PRODUCT_ID,
    platform: 1185,
    managePath: '/account/plans',
  },
]

const defaultLicense = LicenseLookup[0]

type IPlans = {
  initialized: boolean
  plans: IPlan[]
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

const defaultState: IPlans = {
  initialized: false,
  plans: [],
  updating: undefined,
  purchasing: undefined,
  informed: false,
  tests: testData,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init() {
      await dispatch.plans.fetch()
      dispatch.plans.set({ initialized: true })
    },

    async restore(_: void, state) {
      const license = selectRemoteitLicense(state)
      const last = license?.subscription?.card?.last
      const planId = license?.plan.id

      dispatch.plans.set({
        purchasing: localStorage.getItem(PURCHASING_PLAN) !== planId ? planId : undefined,
        updating: localStorage.getItem(UPDATING_PLAN) === last ? last : undefined,
      })
    },
    async fetch() {
      const result = await graphQLBasicRequest(
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
          }`
      )
      if (result === 'ERROR') return
      await dispatch.plans.parse(result)
    },

    async parse(gqlResponse: AxiosResponse<any> | void, state) {
      if (!gqlResponse) return
      const data = gqlResponse?.data?.data
      await dispatch.plans.set({
        plans: data.plans,
        updating: undefined,
      })
    },

    async subscribe(form: IPurchase, state) {
      dispatch.plans.set({ purchasing: form.planId })
      localStorage.setItem(PURCHASING_PLAN, form.planId || '')

      const license = selectRemoteitLicense(state)
      if (license?.subscription) {
        await dispatch.plans.unsubscribe(form.planId)
      }
      const result = await graphQLSubscribe(form)

      if (result === 'ERROR' || !result?.data?.data?.createSubscription) {
        dispatch.ui.set({ errorMessage: 'Checkout failed, please contact support.' })
        dispatch.plans.set({ purchasing: undefined })
        return
      }

      const checkout = result?.data?.data?.createSubscription
      console.log('PURCHASE', checkout)
      if (checkout?.url) window.location.href = checkout.url
      else {
        dispatch.ui.set({ errorMessage: 'Error purchasing license' })
        dispatch.plans.set({ purchasing: undefined })
      }
    },

    async updateSubscription({ priceId, planId, quantity, accountId }: IPurchase) {
      if (!priceId) {
        dispatch.ui.set({ errorMessage: `Plan selection incomplete (${priceId})` })
        return
      }
      dispatch.plans.set({ purchasing: planId || true })
      const result = await graphQLUpdateSubscription({ priceId, quantity, accountId })
      if (result !== 'ERROR') {
        const success = result?.data?.data?.updateSubscription
        if (!success) {
          dispatch.ui.set({ errorMessage: 'Subscription update failed, please contact support.' })
          dispatch.plans.set({ purchasing: undefined })
        }
      }
      setTimeout(() => {
        // event should come from ws and cause the update, otherwise:
        dispatch.plans.set({ purchasing: undefined })
        dispatch.ui.refreshAll()
      }, 30 * 1000)
      console.log('UPDATE SUBSCRIPTION', { priceId, quantity, result })
    },

    async unsubscribe(planId: string | undefined) {
      dispatch.plans.set({ purchasing: planId })
      const result = await graphQLUnsubscribe()
      if (result === 'ERROR' || !result?.data?.data?.cancelSubscription) {
        dispatch.ui.set({ errorMessage: 'Subscription cancellation failed, please contact support.' })
        dispatch.plans.set({ purchasing: undefined })
        return
      }
      dispatch.devices.fetchList()
      console.log('UNSUBSCRIBE')
    },

    async updateCreditCard(last: string | undefined) {
      dispatch.plans.set({ updating: last || true })
      localStorage.setItem(UPDATING_PLAN, last || '')
      const result = await graphQLCreditCard()
      if (result !== 'ERROR') {
        const card = result?.data?.data?.updateCreditCard
        console.log('UPDATE CREDIT CARD', card)
        if (card?.url) window.location.href = card.url
      }
    },

    async updated() {
      await dispatch.plans.fetch()
      await dispatch.organization.fetch()
      dispatch.plans.set({ purchasing: undefined, updating: undefined })
      dispatch.ui.set({ successMessage: 'Subscription updated.' })
    },

    async testServiceLicensing(_: void, state) {
      const states: ILicenseTypes[] = [
        'UNKNOWN',
        'EVALUATION',
        'LICENSED',
        'UNLICENSED',
        'NON_COMMERCIAL',
        'EXEMPT',
        'LEGACY',
      ]
      const devices = getDevices(state)
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
      dispatch.plans.set({
        licenses: [],
        limits: [],
      })
    },
  }),
  reducers: {
    reset(state: IPlans) {
      state = { ...defaultState }
      return state
    },
    set(state: IPlans, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function selectOwnRemoteitLicense(state: ApplicationState): ILicense | null {
  return getLicenses(state, state.auth.user?.id).find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
}

export function selectRemoteitLicense(state: ApplicationState, accountId?: string): ILicense | null {
  return getLicenses(state, accountId).find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
}

export function getLicenses(state: ApplicationState, accountId?: string) {
  if (state.plans.tests.license) return state.plans.tests.licenses
  else return getOrganization(state, accountId).licenses
}

export function getFreeLicenses(state: ApplicationState) {
  if (isEnterprise(state)) return 1
  const purchased = selectRemoteitLicense(state)?.quantity || 0
  const used = getOrganization(state).members.reduce((sum, m) => sum + (m.license === 'LICENSED' ? 1 : 0), 1)
  return Math.max(purchased - used, 0)
}

function isEnterprise(state: ApplicationState) {
  return getLicenses(state).some(l => l.plan.id === ENTERPRISE_PLAN_ID)
}

export function isPersonal(state: ApplicationState) {
  const license = selectOwnRemoteitLicense(state)
  return license?.plan.id === PERSONAL_PLAN_ID
}

export function selectBaseLimits(state: ApplicationState, accountId?: string) {
  if (state.plans.tests.limit) return state.plans.tests.limits
  else return getOrganization(state, accountId).limits
}

export function selectLimit(name: string, state: ApplicationState) {
  return selectBaseLimits(state).find(limit => limit.name === name)?.value
}

export function getInformed(state: ApplicationState) {
  return state.plans.tests.limit ? false : state.plans.informed
}

export function lookupLicenseManagePath(productId?: string) {
  let lookup = LicenseLookup.find(l => l.productId === productId)
  if (!lookup) lookup = defaultLicense
  return lookup.managePath
}

export function lookupLicenseProductId(instance?: IInstance) {
  let lookup = LicenseLookup.find(l => l.platform === (instance as IDevice)?.targetPlatform)
  if (!lookup) lookup = defaultLicense
  return lookup.productId
}

export function selectFullLicense(
  state: ApplicationState,
  { productId, license }: { productId?: string; license?: ILicense }
) {
  license = license || getLicenses(state).find(l => l.plan.product.id === productId)
  const limits = selectBaseLimits(state)
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

export function selectOwnLicenses(state: ApplicationState) {
  return selectLicenses(state, state.auth.user?.id)
}

export function selectLicenses(
  state: ApplicationState,
  accountId?: string
): { licenses: ILicense[]; limits: ILimit[] } {
  return {
    licenses: getLicenses(state, accountId).map(license => ({
      ...license,
      managePath: lookupLicenseManagePath(license.plan.product.id),
      limits: selectBaseLimits(state, accountId).filter(limit => limit.license?.id === license.id),
    })),
    limits: selectBaseLimits(state, accountId).filter(limit => !limit.license),
  }
}

export function selectLicenseIndicator(state: ApplicationState) {
  const informed = getInformed(state)
  if (informed) return 0
  let indicators = 0
  const { licenses } = selectLicenses(state)
  for (var license of licenses) {
    const { noticeType } = selectFullLicense(state, { license })
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

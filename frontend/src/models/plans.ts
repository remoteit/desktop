import { testData } from '../test/licensing'
import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { State } from '../store'
import { Duration } from 'luxon'
import {
  graphQLSubscribe,
  graphQLUnsubscribe,
  graphQLUpdateSubscription,
  graphQLCreditCard,
} from '../services/graphQLMutation'
import {
  selectLicensesWithLimits,
  selectRemoteitLicense,
  selectOrganization,
  selectLimits,
  selectLicenses,
  selectPlan,
} from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLFetchPlans } from '../services/graphQLRequest'
import { getDevices } from '../selectors/devices'
import { RootModel } from '.'
import cloudSync from '../services/CloudSync'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number }

const PURCHASING_PLAN = 'plans.purchasing'
const UPDATING_PLAN = 'plans.updating'

export const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
export const AWS_PRODUCT_ID = '55d9e884-05fd-11eb-bda8-021f403e8c27'
export const PERSONAL_PLAN_ID = 'e147a026-81d7-11eb-afc8-02f048730623'
export const PROFESSIONAL_PLAN_ID = '6b5e1e70-045d-11ec-8a08-02ea65a4da2d'
export const BUSINESS_PLAN_ID = '85ce6edf-9e70-11ec-b51a-0a63867cb0b9'
export const FLEET_PLAN_ID = 'ce579369-9deb-11ee-9f81-0a5b07a7ad3f'
export const ENTERPRISE_PLAN_ID = 'b44f92a6-a7b9-11eb-b094-02a962787033'

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: REMOTEIT_PRODUCT_ID,
    platform: undefined,
  },
  {
    productId: AWS_PRODUCT_ID,
    platform: 1185,
  },
]

const defaultLicense = LicenseLookup[0]

export const planDetails = {
  [PERSONAL_PLAN_ID]: {
    description: 'For non-commercial usage only',
    features: [
      '5 Devices',
      '7 days of activity logs',
      'Limited API usage',
      'Web/Desktop/Mobile apps',
      'SSO with Google',
    ],
  },
  [PROFESSIONAL_PLAN_ID]: {
    description: 'Basic commercial use plan',
    note: 'when billed annually',
    features: [
      '3 Devices & 1 user per license',
      'Commercial usage',
      'Organization Management (basic roles)',
      'Basic device tagging',
      'Virtual Networks',
      '30 days of activity logs',
      'Limited API usage',
      'Forum support',
    ],
  },
  [BUSINESS_PLAN_ID]: {
    description: 'Simplifies network management',
    note: 'when billed annually',
    features: [
      '10 Devices & 1 user per license',
      'Organization Management including custom roles',
      'Virtual networks with custom roles, enhanced device tagging',
      'SSO with SAML or select identity providers',
      'Scripting',
      '1 year of activity logs',
      'Unrestricted API usage',
      'Email support',
    ],
  },
  [FLEET_PLAN_ID]: {
    description: 'Device centric business plan',
    note: 'discounted monthly price',
    features: [
      '100 devices per license',
      '5 user accounts',
      'Add additional devices in 100 device increments',
      'Discounted monthly pricing matches annual pricing',
      'Includes all Business Plan features',
    ],
  },
  [ENTERPRISE_PLAN_ID]: {
    description: 'Custom plan for large scale deployment',
    features: [
      'Volume based discounts for users and devices',
      'Statement of Work based projects: development, support, deployment & onboarding',
      'Custom activity log retention',
      'Additional support options: Slack, phone',
      'Provision of customer specific environments: custom portals, dedicated proxy, named device URLs, and more',
      'Fixed permanent named endpoint URLs',
      'Support for embedded devices and custom device packages',
      'Large-scale solutions for unique and custom use-cases',
    ],
  },
}

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
      const result = await graphQLFetchPlans()
      if (result === 'ERROR') return
      await dispatch.plans.parse(result)
    },

    async parse(gqlResponse: AxiosResponse<any> | void, state) {
      if (!gqlResponse) return
      const data = gqlResponse?.data?.data
      await dispatch.plans.set({
        plans: data.plans,
        updating: undefined,
        initialized: true,
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
      dispatch.plans.set({ purchasing: planId })
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
        cloudSync.all()
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
      dispatch.plans.set({ updating: last })
      localStorage.setItem(UPDATING_PLAN, last || '')
      const result = await graphQLCreditCard()
      if (result !== 'ERROR') {
        const card = result?.data?.data?.updateCreditCard
        console.log('UPDATE CREDIT CARD', card)
        if (card?.url) window.location.href = card.url
      }
    },

    async updated() {
      await cloudSync.call([dispatch.plans.fetch, dispatch.organization.fetch, dispatch.devices.fetchList], true)
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
  }),
  reducers: {
    reset(state: IPlans) {
      state = { ...defaultState }
      return state
    },
    set(state: IPlans, params: Partial<IPlans>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function getAvailableUsers(state: State) {
  if (isEnterprise(state)) return 1
  const purchased = selectRemoteitLicense(state)?.quantity || 0
  const plan = selectPlan(state)
  const totals = deviceUserTotal(purchased, plan)
  const used = selectOrganization(state).members.reduce((sum, m) => sum + (m.license === 'LICENSED' ? 1 : 0), 1)
  return Math.max(totals.users - used, 0)
}

function isEnterprise(state: State) {
  return selectLicenses(state).some(l => l.plan.id === ENTERPRISE_PLAN_ID)
}

export function isPersonal(state: State) {
  const license = selectRemoteitLicense(state)
  return license?.plan.id === PERSONAL_PLAN_ID
}

export function getInformed(state: State) {
  return state.plans.tests.limit ? false : state.plans.informed
}

export function lookupLicenseProductId(instance?: IInstance) {
  let lookup = LicenseLookup.find(l => l.platform === (instance as IDevice)?.targetPlatform)
  if (!lookup) lookup = defaultLicense
  return lookup.productId
}

export function selectFullLicense(state: State, { productId, license }: { productId?: string; license?: ILicense }) {
  license = license || selectLicenses(state).find(l => l.plan.product.id === productId)
  const limits = selectLimits(state)
  const informed = getInformed(state)

  const serviceLimit = limits.find(l => l.name === 'aws-services')
  const evaluationLimit = limits.find(l => l.name === 'aws-evaluation')

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
  }
}

export function selectOwnLicenses(state: State) {
  return selectLicensesWithLimits(state, state.auth.user?.id)
}

export function selectLicenseIndicator(state: State) {
  const accountId = selectActiveAccountId(state)
  const informed = getInformed(state)
  if (informed) return 0
  let indicators = 0
  const { licenses } = selectLicensesWithLimits(state, accountId)
  for (var license of licenses) {
    const { noticeType } = selectFullLicense(state, { license })
    if (noticeType && noticeType !== 'ACTIVE') indicators++
  }
  return indicators
}

export function limitDays(value?: string) {
  return value ? Duration.fromISO(value).as('days') : 0
}

export function humanizeDays(value?: string) {
  const milliseconds = limitDays(value) * 8.64e7
  return humanize(milliseconds, { round: true, largest: 1 })
}

export function deviceUserTotal(quantity: number, plan?: IPlan) {
  const defaults = { devices: null, users: null }
  if (!plan) return defaults
  const users = plan.limits?.find(l => l.name === 'org-users')
  const devices = plan.limits?.find(l => l.name === 'iot-devices')
  if (!users || !devices) return defaults
  return { devices: devices.value + quantity * devices.scale, users: users.value + quantity * users.scale }
}

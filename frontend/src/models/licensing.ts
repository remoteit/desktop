import { Duration } from 'luxon'
import { testData } from '../test/licensing'
import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number; upgradeUrl: string }

export const REMOTEIT_PRODUCT_ID = 'b999e047-5532-11eb-8872-063ce187bcd7'
export const AWS_PRODUCT_ID = '55d9e884-05fd-11eb-bda8-021f403e8c27'

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: REMOTEIT_PRODUCT_ID,
    platform: undefined,
    upgradeUrl: 'https://link.remote.it/portal/account',
  },
  {
    productId: AWS_PRODUCT_ID,
    platform: 1185,
    upgradeUrl: 'https://link.remote.it/aws-marketplace/saas',
  },
]

const defaultLicense = LicenseLookup[0]

type ILicensing = {
  licenses: ILicense[]
  limits: ILimit[]
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
  licenses: [],
  limits: [],
  informed: false,
  tests: testData,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: (dispatch: any) => ({
    async fetch() {
      try {
        const result: any = await graphQLRequest(
          ` {
              login {
                licenses {
                  id
                  created
                  updated
                  expiration
                  valid
                  quantity
                  plan {
                    id
                    name
                    description
                    duration
                    product {
                      id
                      name
                      description
                    }
                  }
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
        dispatch.licensing.parse(result?.data?.data?.login)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async parse(data: any) {
      if (!data) return
      console.log('LICENSING', data)
      dispatch.licensing.set({
        licenses: data.licenses.map((l: any) => ({
          ...l,
          created: new Date(l.created),
          updated: new Date(l.updated),
          expiration: l.expiration && new Date(l.expiration),
        })),
        limits: data.limits,
      })
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

export function lookupLicenseUpgradeUrl(productId?: string) {
  let lookup = LicenseLookup.find(l => l.productId === productId)
  if (!lookup) lookup = defaultLicense
  return lookup.upgradeUrl
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
  const upgradeUrl = lookupLicenseUpgradeUrl(productId)

  if (!license) return {}

  let noticeType
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 3) // warn 3 days in advance

  if (license.expiration && warnDate > license.expiration) noticeType = 'EXPIRATION_WARNING' // && license.plan.name === 'TRIAL'
  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value) noticeType = 'LIMIT_EXCEEDED'
  if (!license.valid) noticeType = 'EXPIRED'

  return {
    noticeType,
    license,
    informed,
    limits,
    serviceLimit,
    evaluationLimit,
    upgradeUrl,
  }
}

export function selectLicenses(state: ApplicationState) {
  return {
    licenses: getLicenses(state).map(license => ({
      ...license,
      upgradeUrl: lookupLicenseUpgradeUrl(license.plan.product.id),
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

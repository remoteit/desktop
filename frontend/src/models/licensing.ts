import { Duration } from 'luxon'
import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { colors, Color } from '../styling'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'
import { lighten } from '@material-ui/core'
import humanize from 'humanize-duration'

type ILicenseLookup = { productId: string; platform?: number; upgradeUrl: string }

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: 'b999e047-5532-11eb-8872-063ce187bcd7',
    platform: undefined,
    upgradeUrl: 'https://link.remote.it/portal/account',
  },
  {
    productId: '55d9e884-05fd-11eb-bda8-021f403e8c27',
    platform: 1185,
    upgradeUrl: 'https://link.remote.it/aws-marketplace/saas',
  },
]

const defaultLicense = LicenseLookup[0]

type ILicensing = {
  licenses: ILicense[]
  limits: ILimit[]
  informed: boolean
  chip: ILookup<ILicenseChip>
  tests: {
    license: boolean
    limit: boolean
    unlicensed: boolean
    licenses: ILicense[]
    limits: ILimit[]
  }
}

const state: ILicensing = {
  licenses: [],
  limits: [],
  informed: false,
  chip: {
    UNKNOWN: { name: 'Unknown', color: colors.grayDarker, colorName: 'grayDarker' },
    EVALUATION: {
      name: 'Evaluation',
      color: colors.warning,
      background: lighten(colors.warning, 0.94),
      colorName: 'warning',
      show: true,
    },
    LICENSED: { name: 'Licensed', color: colors.grayDarker, colorName: 'grayDarker' },
    UNLICENSED: {
      name: 'Unlicensed',
      color: colors.warning,
      background: lighten(colors.warning, 0.94),
      colorName: 'warning',
      disabled: true,
      show: true,
    },
    NON_COMMERCIAL: { name: 'Non-commercial', color: colors.grayDarker, colorName: 'grayDarker' },
    LEGACY: { name: 'Legacy', color: colors.grayDarker, colorName: 'grayDarker' },
  },
  tests: {
    license: false,
    limit: false,
    unlicensed: false,
    licenses: [
      {
        id: 'e46e5c55-7d12-46c5-aee3-493e29e604db',
        created: new Date('2020-10-17T01:03:47.976Z'),
        updated: new Date('2020-10-17T01:03:47.976Z'),
        expiration: new Date('2020-11-05T01:03:48.000Z'),
        valid: true,
        plan: {
          id: '649b2e68-05fd-11eb-bda8-021f403e8c27',
          name: 'TRIAL',
          description: 'trial',
          duration: 'P30D',
          product: {
            id: '55d9e884-05fd-11eb-bda8-021f403e8c27',
            name: 'AWS',
            description: 'AWS',
            provider: 'AWS',
          },
        },
      },
      {
        id: '4a5ed500-ef07-4a98-be11-PERSONAL',
        created: new Date('2021-03-12T05:44:32.421Z'),
        updated: new Date('2021-03-12T05:44:32.421Z'),
        expiration: new Date('2021-02-12T05:44:32.421Z'),
        valid: false,
        plan: {
          id: 'e147a026-81d7-11eb-afc8-02f048730623',
          name: 'PERSONAL',
          description: 'personal',
          duration: null,
          product: {
            id: 'b999e047-5532-11eb-8872-063ce187bcd7',
            name: 'remote.it',
            description: 'remote.it',
            provider: null,
          },
        },
      },
      {
        id: '4a5ed500-ef07-4a98-be11-PROFESSIONAL',
        created: new Date('2021-03-12T05:44:32.421Z'),
        updated: new Date('2021-03-12T05:44:32.421Z'),
        expiration: new Date('2021-02-12T05:44:32.421Z'),
        valid: false,
        plan: {
          id: 'e147a026-81d7-11eb-afc8-02f048730623',
          name: 'PROFESSIONAL',
          description: 'professional',
          duration: null,
          product: {
            id: 'b999e047-5532-11eb-8872-063ce187bcd7',
            name: 'remote.it',
            description: 'remote.it',
            provider: null,
          },
        },
      },
      {
        id: '4a5ed500-ef07-4a98-be11-BUSINESS',
        created: new Date('2021-03-12T05:44:32.421Z'),
        updated: new Date('2021-03-12T05:44:32.421Z'),
        expiration: null,
        valid: true,
        plan: {
          id: 'e147a026-81d7-11eb-afc8-02f048730623',
          name: 'BUSINESS',
          description: 'business',
          duration: null,
          product: {
            id: 'b999e047-5532-11eb-8872-063ce187bcd7',
            name: 'remote.it',
            description: 'remote.it',
            provider: null,
          },
        },
      },
    ],
    limits: [
      {
        name: 'log-limit',
        value: 'P1Y',
        actual: null,
        license: null,
      },
      {
        name: 'aws-evaluation',
        value: 'P7D',
        actual: null,
        license: {
          id: 'e46e5c55-7d12-46c5-aee3-493e29e604db',
        },
      },
      {
        name: 'aws-services',
        value: null,
        actual: 0,
        license: {
          id: 'e46e5c55-7d12-46c5-aee3-493e29e604db',
        },
      },
      {
        name: 'iot-devices',
        value: 0,
        actual: 0,
        license: {
          id: '4a5ed500-ef07-4a98-be11-PERSONAL',
        },
      },
      {
        name: 'iot-nc-devices',
        value: 5,
        actual: 2,
        license: {
          id: '4a5ed500-ef07-4a98-be11-PERSONAL',
        },
      },
      {
        name: 'iot-nc-devices',
        value: 5,
        actual: 5,
        license: {
          id: '4a5ed500-ef07-4a98-be11-PROFESSIONAL',
        },
      },
      {
        name: 'iot-devices',
        value: 25,
        actual: 30,
        license: {
          id: '4a5ed500-ef07-4a98-be11-PROFESSIONAL',
        },
      },
      {
        name: 'iot-nc-devices',
        value: 5,
        actual: 1,
        license: {
          id: '4a5ed500-ef07-4a98-be11-BUSINESS',
        },
      },
      {
        name: 'iot-devices',
        value: 100,
        actual: 7,
        license: {
          id: '4a5ed500-ef07-4a98-be11-BUSINESS',
        },
      },
    ],
  },
}

export default createModel<RootModel>()({
  state,
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
                  plan {
                    id
                    name
                    description
                    duration
                    product {
                      id
                      name
                      description
                      provider
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
    set(state: ILicensing, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function getLicenses(state: ApplicationState) {
  if (state.licensing.tests.license) return state.licensing.tests.licenses
  else return state.licensing.licenses
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

import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLHandleError } from '../services/graphQL'

type ILicenseLookup = { productId: string; platform: number }

export const LicenseLookup: ILicenseLookup[] = [
  {
    productId: '55d9e884-05fd-11eb-bda8-021f403e8c27',
    platform: 1185,
  },
]

type ILicensing = ILookup<any> & {
  licenses: ILicense[]
  limits: ILimit[]
}

const state: ILicensing = {
  licenses: [],
  limits: [],
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetch() {
      try {
        const result = await graphQLRequest(
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
        await graphQLHandleError(error)
      }
    },
    async parse(data: any) {
      if (!data) return
      dispatch.licensing.set({
        licenses: data.licenses.map((l: any) => ({
          ...l,
          created: new Date(l.created),
          updated: new Date(l.updated),
          expiration: new Date(l.expiration),
        })),
        limits: data.limits,
        // licenses: [
        //   {
        //     id: 'e46e5c55-7d12-46c5-aee3-493e29e604db',
        //     created: new Date('2020-10-17T01:03:47.976Z'),
        //     updated: new Date('2020-10-17T01:03:47.976Z'),
        //     expiration: new Date('2020-11-05T01:03:48.000Z'),
        //     valid: true,
        //     plan: {
        //       id: '649b2e68-05fd-11eb-bda8-021f403e8c27',
        //       name: 'TRIAL',
        //       description: 'trial',
        //       duration: 'P30D',
        //       product: {
        //         id: '55d9e884-05fd-11eb-bda8-021f403e8c27',
        //         name: 'remote.it for AWS',
        //         description: 'remote.it for AWS',
        //         provider: 'AWS',
        //       },
        //     },
        //   },
        // ],
        // limits: [
        //   {
        //     name: 'aws-evaluation',
        //     value: 'P7D',
        //     actual: null,
        //   },
        //   {
        //     name: 'aws-services',
        //     value: 5,
        //     actual: 4,
        //     license: { id: 'e46e5c55-7d12-46c5-aee3-493e29e604db' },
        //   },
        // ],
      })
    },
  }),
  reducers: {
    set(state: ILicensing, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})

const upgradeUrl = 'https://downloads.remote.it/aws/latest/saas'

export function lookupLicenseProductId(device?: IDevice) {
  const lookup = LicenseLookup.find(l => l.platform === device?.targetPlatform)
  return lookup?.productId
}

export function selectLicense(state: ApplicationState, productId?: string) {
  const license = state.licensing.licenses.find(l => l.plan.product.id === productId)
  const limits = state.licensing.limits

  const serviceLimit = limits.find(l => l.name === 'aws-services')
  const evaluationLimit = limits.find(l => l.name === 'aws-evaluation')

  if (!license) return {}

  let noticeType
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 3) // warn 3 days in advance

  if (warnDate > license.expiration && license.plan.name === 'TRIAL') noticeType = 'EXPIRATION_WARNING'
  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value) noticeType = 'LIMIT_EXCEEDED'
  if (!license.valid) noticeType = 'EXPIRED'

  return {
    noticeType,
    license,
    limits,
    serviceLimit,
    evaluationLimit,
    upgradeUrl,
  }
}

export function selectLicenses(state: ApplicationState) {
  const { licensing } = state
  return {
    licenses: licensing.licenses.map(license => ({
      ...license,
      limits: licensing.limits.filter(limit => limit.license?.id === license.id),
    })),
    limits: licensing.limits.filter(limit => !limit.license),
    upgradeUrl,
  }
}

export function selectLicenseIndicator(state: ApplicationState) {
  let indicators = 0
  const { licenses } = selectLicenses(state)
  for (var license of licenses) {
    const { noticeType } = selectLicense(state, license?.plan.product.id)
    if (noticeType) indicators++
  }
  return indicators
}

export function evaluationDays(value?: string) {
  return value ? value.replace(/\D/g, '') : null
}

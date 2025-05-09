import { selectDeviceColumns } from '../selectors/devices'
import { graphQLBasicRequest } from './graphQL'
import { removeDeviceName } from '@common/nameHelper'
import { getTimeZone } from '../helpers/dateHelper'
import { getAttribute } from '../components/Attributes'
import { store } from '../store'

const DEVICE_PRELOAD_ATTRIBUTES = ['id', 'deviceName', 'status', 'permissions', 'owner', 'quality', 'license']

const SERVICE_PRELOAD_ATTRIBUTES = ['serviceId']

const ServiceSelectLookup: ILookup<string, string> = {
  serviceId: `
  id
  name
  state
  title
  license
  application
  subdomain
  proxy
  link(type: [HTTPS, WSS]) {
    url
    code
    created
    password
    enabled
  }`,

  serviceView: `
  enabled
  created
  lastReported
  port
  host
  type
  protocol
  attributes
  presenceAddress
  access {
    user {
      id
      email
    }
  }`,

  serviceTimeSeries: `
  timeSeries(type: $serviceTSType, resolution: $serviceTSResolution, length: $serviceTSLength, timezone: "${getTimeZone()}") {
    type
    resolution
    start
    end
    time
    data
  }`,
}

const SERVICE_SELECT = Object.keys(ServiceSelectLookup)
  .map(k => ServiceSelectLookup[k])
  .join('')

const DeviceSelectLookup: ILookup<string, string> = {
  id: `
  id`,

  deviceName: `
  name
  configurable
  scriptable
  platform
  state`,

  license: `
  license`,

  version: `
  version`,

  hardwareId: `
  hardwareId`,

  lastReported: `
  lastReported`,

  permissions: `
  permissions`,

  created: `
  created`,

  attributes: `
  attributes`,

  tags: `
  tags (accountId: $accountId) {
    name
    color
    created
  }`,

  access: `
  access {
    user {
      id
      email
    }
    scripting
  }`,

  endpoint: `
  endpoint {
    onlineSince
    offlineSince
    externalAddress
    internalAddress
    availability
    instability
    quality
    geo {
      connectionType
      countryName
      stateName
      city
      isp
    }
  }`,

  owner: `
  owner {
    id
    email
  }`,

  presence: `
  presenceAddress
  `,

  installs: `
  supportedAppInstalls {
    id
  }
  `,

  notifications: `
  notificationSettings {
    emailNotifications
    desktopNotifications
  }`,

  deviceTimeSeries: `
  timeSeries(type: $deviceTSType, resolution: $deviceTSResolution, length: $deviceTSLength, timezone: "${getTimeZone()}") {
    type
    resolution
    start
    end
    time
    data
  }`,
}

const DEVICE_SELECT = Object.keys(DeviceSelectLookup)
  .filter(k => k !== 'services')
  .map(k => DeviceSelectLookup[k])
  .join('')

const DEVICE_TIME_SERIES_PARAMS =
  ', $deviceTSType: TimeSeriesType!, $deviceTSResolution: TimeSeriesResolution!, $deviceTSLength: Int'

const SERVICE_TIME_SERIES_PARAMS =
  ', $serviceTSType: TimeSeriesType!, $serviceTSResolution: TimeSeriesResolution!, $serviceTSLength: Int'

export async function graphQLFetchDeviceList(params: gqlOptions) {
  return await graphQLBasicRequest(
    ` query DeviceList($size: Int, $from: Int, $name: String, $state: String, $tag: ListFilter, $accountId: String, $sort: String, $owner: Boolean, $application: [Int!], $platform: [Int!]${
      (params.columns.includes('deviceTimeSeries') ? DEVICE_TIME_SERIES_PARAMS : '') +
      (params.columns.includes('serviceTimeSeries') ? SERVICE_TIME_SERIES_PARAMS : '')
    }) {
        login {
          id
          account(id: $accountId) {
            devices(size: $size, from: $from, name: $name, state: $state, tag: $tag, sort: $sort, owner: $owner, application: $application, platform: $platform) {
              total
              items {
                ${deviceQueryColumns(params.columns)}
              }
            }
          }
        }
      }`,
    {
      tag: params.tag,
      size: params.size,
      from: params.from,
      state: params.state,
      sort: params.sort,
      owner: params.owner,
      application: params.applicationTypes,
      accountId: params.accountId,
      platform: params.platform,
      name: params.name?.trim() || undefined,
      deviceTSLength: params.deviceTimeSeries?.length,
      deviceTSType: params.deviceTimeSeries?.type,
      deviceTSResolution: params.deviceTimeSeries?.resolution,
      serviceTSLength: params.serviceTimeSeries?.length,
      serviceTSType: params.serviceTimeSeries?.type,
      serviceTSResolution: params.serviceTimeSeries?.resolution,
    }
  )
}

export async function graphQLPreloadDevices(params: {
  accountId: string
  ids: string[]
  columns: string[]
  serviceTimeSeries?: ITimeSeriesOptions
  deviceTimeSeries?: ITimeSeriesOptions
}) {
  return await graphQLBasicRequest(
    ` query DevicePreload($ids: [String!]!, $accountId: String${
      (params.columns.includes('deviceTimeSeries') ? DEVICE_TIME_SERIES_PARAMS : '') +
      (params.columns.includes('serviceTimeSeries') ? SERVICE_TIME_SERIES_PARAMS : '')
    }) {
        login {
          id
          account(id: $accountId) {
            device(id: $ids) {
              ${deviceQueryColumns(params.columns)}
            }
          }
        }
      }`,
    {
      ...params,
      deviceTSLength: params.deviceTimeSeries?.length,
      deviceTSType: params.deviceTimeSeries?.type,
      deviceTSResolution: params.deviceTimeSeries?.resolution,
      serviceTSLength: params.serviceTimeSeries?.length,
      serviceTSType: params.serviceTimeSeries?.type,
      serviceTSResolution: params.serviceTimeSeries?.resolution,
    }
  )
}

export async function graphQLFetchConnections(params: { ids: string[] }) {
  return await graphQLBasicRequest(
    ` query Connections($ids: [String!]!) {
        login {
          id
          device(id: $ids)  {
            ${deviceQueryColumns(selectDeviceColumns(store.getState()), ['tags', 'deviceTimeSeries'])}
          }
        }
      }`,
    params
  )
}

/* 
  Fetches single, or array of devices across shared accounts by id
*/
export async function graphQLFetchFullDevice(
  id: string,
  accountId: string,
  serviceTimeSeries?: ITimeSeriesOptions,
  deviceTimeSeries?: ITimeSeriesOptions
) {
  return await graphQLBasicRequest(
    ` query Device($id: [String!]!, $accountId: String${SERVICE_TIME_SERIES_PARAMS + DEVICE_TIME_SERIES_PARAMS}) {
        login {
          id
          device(id: $id) {
            ${DEVICE_SELECT}
            services {
              ${SERVICE_SELECT}
            }
          }
        }
      }`,
    {
      id,
      accountId,
      deviceTSLength: deviceTimeSeries?.length,
      deviceTSType: deviceTimeSeries?.type,
      deviceTSResolution: deviceTimeSeries?.resolution,
      serviceTSLength: serviceTimeSeries?.length,
      serviceTSType: serviceTimeSeries?.type,
      serviceTSResolution: serviceTimeSeries?.resolution,
    }
  )
}

export async function graphQLFetchDeviceCount({ size, tag, owner, accountId }: gqlOptions) {
  return await graphQLBasicRequest(
    ` query DeviceCount($size: Int, $tag: ListFilter, $accountId: String, $owner: Boolean) {
        login {
          account(id: $accountId) {
            devices(tag: $tag, owner: $owner, size: $size) {
              total
            }
          }
        }
      }`,
    {
      size,
      tag,
      owner,
      accountId,
    }
  )
}

export function graphQLDeviceAdaptor({
  gqlDevices,
  accountId,
  hidden,
  loaded,
  serviceLoaded,
}: {
  gqlDevices: any[]
  accountId: string
  hidden?: boolean
  loaded?: boolean
  serviceLoaded?: boolean
}): IDevice[] {
  if (!gqlDevices || !gqlDevices.length) return []
  const state = store.getState()
  const thisId = state.backend.thisId
  let customAttributes = new Set<string>()
  let data: IDevice[] = gqlDevices?.map((d: any): IDevice => {
    const owner = d.owner || state.auth.user
    return {
      id: d.id,
      name: d.name,
      owner: owner,
      state: d.state,
      loaded: !!loaded,
      configurable: d.configurable,
      scriptable: d.scriptable,
      hardwareId: d.hardwareId,
      createdAt: d.created ? new Date(d.created) : undefined,
      contactedAt: d.endpoint?.timestamp ? new Date(d.endpoint?.timestamp) : undefined,
      shared: accountId !== owner.id, //loginId !== owner.id && accountId === loginId,
      lastReported: d.lastReported && new Date(d.lastReported),
      externalAddress: d.endpoint?.externalAddress,
      internalAddress: d.endpoint?.internalAddress,
      targetPlatform: d.platform, // || 1214,
      availability: d.endpoint?.availability,
      instability: d.endpoint?.instability,
      quality: d.endpoint?.quality,
      onlineSince: new Date(d.endpoint?.onlineSince).getTime(),
      offlineSince: new Date(d.endpoint?.offlineSince).getTime(),
      version: d.version ? parseFloat(d.version) : undefined,
      geo: d.endpoint?.geo,
      license: d.license,
      permissions: d.permissions || [],
      attributes: processDeviceAttributes(d, customAttributes),
      tags: d.tags?.map(t => ({ ...t, created: new Date(t.created) })) || [],
      services: graphQLServiceAdaptor(d, loaded || serviceLoaded),
      presenceAddress: d.presenceAddress,
      notificationSettings: d.notificationSettings,
      supportedAppInstalls: d.supportedAppInstalls?.map(i => i.id) || [],
      timeSeries: processTimeSeries(d),
      access:
        d.access?.map((a: any) => ({
          id: a.user?.id,
          email: a.user?.email || a.user?.id,
          scripting: a.scripting,
        })) || [],
      thisDevice: d.id === thisId,
      hidden: !!hidden,
      accountId,
    }
  })
  store.dispatch.devices.customAttributes(customAttributes)
  store.dispatch.connections.updateFromServices({ devices: data, accountId })
  return data
}

export function graphQLServiceAdaptor(device: any, loaded?: boolean): IService[] {
  return (
    device.services?.map(
      (s: any): IService => ({
        id: s.id,
        type: s.title,
        state: s.state,
        loaded: !!loaded,
        enabled: s.enabled,
        typeID: s.application,
        deviceID: device.id,
        subdomain: s.subdomain,
        createdAt: new Date(s.created),
        lastReported: s.lastReported && new Date(s.lastReported),
        contactedAt: new Date(s.endpoint?.timestamp),
        license: s.license,
        attributes: processServiceAttributes(s),
        name: removeDeviceName(device.name, s.name),
        port: s.port,
        host: s.host,
        protocol: s.protocol,
        presenceAddress: s.presenceAddress,
        timeSeries: processTimeSeries(s),
        link: s.link && {
          ...s.link,
          web: s.link?.url.startsWith('http'),
          created: new Date(s.link.created),
        },
        access: s.access?.map(e => ({
          email: e.user?.email || e.user?.id,
          id: e.user?.id,
        })),
      })
    ) || []
  )
}

function deviceQueryColumns(selectedColumns: string[], filter?: string[]) {
  let columns = DEVICE_PRELOAD_ATTRIBUTES.concat(SERVICE_PRELOAD_ATTRIBUTES).concat(selectedColumns)
  columns = columns.filter(c => (filter ? !filter.includes(c) : true))
  return attributeQuery(columns)
}

function attributeQuery(attributes: string[]) {
  let lookup = new Set<string>()
  let query = ''
  let serviceQuery = ''

  attributes.forEach(c => {
    const a = getAttribute(c)
    lookup.add(a.query || a.id)
  })

  for (const l of lookup) {
    if (DeviceSelectLookup[l]) {
      query += DeviceSelectLookup[l]
    } else if (ServiceSelectLookup[l]) {
      serviceQuery += ServiceSelectLookup[l]
      // } else {
      //   console.warn(`Missing query for attribute %c${l}`, 'font-weight: bold')
    }
  }

  if (serviceQuery) {
    query += `
    services { ${serviceQuery} }`
  }

  return query
}

function processDeviceAttributes(response: any, customAttributes: Set<string>): IDevice['attributes'] {
  for (const attribute in response.attributes) {
    if (attribute !== '$remoteit') customAttributes.add(attribute)
  }
  return processAttributes(response)
}

function processServiceAttributes(response: any): IService['attributes'] {
  return processAttributes(response)
}

function processAttributes(response: any): ILookup<any> {
  const root = response.attributes || {}
  const $ = root.$remoteit || {}
  let result = { ...root, ...$ }
  delete result.$remoteit
  return result
}

function processTimeSeries(response: any): ITimeSeries | undefined {
  if (!response.timeSeries) return
  const timeSeries = response.timeSeries
  return {
    ...timeSeries,
    start: new Date(timeSeries.start),
    end: new Date(timeSeries.end),
    time: timeSeries.time.map((t: any) => new Date(t)),
  }
}

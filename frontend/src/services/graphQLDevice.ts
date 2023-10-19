import { graphQLRequest, graphQLBasicRequest } from './graphQL'
import { removeDeviceName } from '../shared/nameHelper'
import { getTimeZone } from '../helpers/dateHelper'
import { getAttribute } from '../components/Attributes'
import { store } from '../store'

const DEVICE_PRELOAD_ATTRIBUTES = ['id', 'deviceName', 'status', 'permissions', 'owner', 'quality', 'license']

const SERVICE_PRELOAD = `
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
  }`

export const SERVICE_SELECT = `
  ${SERVICE_PRELOAD}
  enabled
  created
  lastReported
  port
  host
  type
  protocol
  attributes
  presenceAddress
  timeSeries(type: $serviceTSType, resolution: $serviceTSResolution, length: $serviceTSLength, timezone: "${getTimeZone()}") {
    type
    resolution
    start
    end
    time
    data
  }
  access {
    user {
      id
      email
    }
  }`

const DeviceSelectLookup: ILookup<string> = {
  id: `
  id`,

  deviceName: `
  name
  configurable
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

  services: `
  services {
    ${SERVICE_PRELOAD}
  }`,

  endpoint: `
  endpoint {
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

  notifications: `
  notificationSettings {
    emailNotifications
    desktopNotifications
  }`,

  timeSeries: `
  timeSeries(type: $deviceTSType, resolution: $deviceTSResolution, length: $deviceTSLength, timezone: "${getTimeZone()}") {
    type
    resolution
    start
    end
    time
    data
  }`,
}

export const DEVICE_SELECT = Object.keys(DeviceSelectLookup)
  .filter(k => k !== 'services')
  .map(k => DeviceSelectLookup[k])
  .join('')

const DEVICE_TIME_SERIES_PARAMS =
  ', $deviceTSType: TimeSeriesType!, $deviceTSResolution: TimeSeriesResolution!, $deviceTSLength: Int'
const SERVICE_TIME_SERIES_PARAMS =
  ', $serviceTSType: TimeSeriesType!, $serviceTSResolution: TimeSeriesResolution!, $serviceTSLength: Int'

export async function graphQLFetchDeviceList(params: gqlOptions) {
  const selectedColumns = store.getState().ui.columns
  return await graphQLRequest(
    ` query DeviceList($size: Int, $from: Int, $name: String, $state: String, $tag: ListFilter, $accountId: String, $sort: String, $owner: Boolean, $platform: [Int!]${
      selectedColumns.includes('timeSeries') ? DEVICE_TIME_SERIES_PARAMS : ''
    }) {
        login {
          id
          account(id: $accountId) {
            devices(size: $size, from: $from, name: $name, state: $state, tag: $tag, sort: $sort, owner: $owner, platform: $platform) {
              total
              items {
                ${deviceQueryColumns(selectedColumns)}
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
      accountId: params.accountId,
      platform: params.platform,
      name: params.name?.trim() || undefined,
      deviceTSLength: params.timeSeries?.length,
      deviceTSType: params.timeSeries?.type,
      deviceTSResolution: params.timeSeries?.resolution,
    }
  )
}

export async function graphQLPreloadDevices(params: {
  accountId: string
  ids: string[]
  timeSeries?: ITimeSeriesOptions
}) {
  const selectedColumns = store.getState().ui.columns
  return await graphQLRequest(
    ` query DevicePreload($ids: [String!]!, $accountId: String${
      selectedColumns.includes('timeSeries') ? DEVICE_TIME_SERIES_PARAMS : ''
    }) {
        login {
          id
          account(id: $accountId) {
            device(id: $ids) {
              ${deviceQueryColumns(selectedColumns)}
            }
          }
        }
      }`,
    {
      ...params,
      deviceTSLength: params.timeSeries?.length,
      deviceTSType: params.timeSeries?.type,
      deviceTSResolution: params.timeSeries?.resolution,
    }
  )
}

export async function graphQLPreloadNetworks(accountId: string, timeSeries?: ITimeSeriesOptions) {
  const selectedColumns = store.getState().ui.columns
  return await graphQLBasicRequest(
    ` query Networks($accountId: String${selectedColumns.includes('timeSeries') ? DEVICE_TIME_SERIES_PARAMS : ''}) {
      login {
        account(id: $accountId) {
          networks {
            id
            name
            created
            permissions
            owner {
              id
              email
            }
            connections {
              service {
                ${SERVICE_PRELOAD}
                device {
                  ${deviceQueryColumns(selectedColumns, ['services'])}
                }          
              }
              name
              port
            }
            tags {
              name
              color
              created
            }
            access {
              user {
                id
                email
              }
            }
          }
        }
      }
    }`,
    {
      accountId,
      deviceTSLength: timeSeries?.length,
      deviceTSType: timeSeries?.type,
      deviceTSResolution: timeSeries?.resolution,
    }
  )
}

export async function graphQLFetchConnections(params: { ids: string[] }) {
  return await graphQLRequest(
    ` query Connections($ids: [String!]!) {
        login {
          id
          device(id: $ids)  {
            ${deviceQueryColumns(store.getState().ui.columns, ['tags', 'timeSeries'])}
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
  return await graphQLRequest(
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

/* 
  Fetches single network across shared accounts by id
*/
export async function graphQLFetchNetworkServices(
  id: string,
  accountId: string,
  serviceTimeSeries?: ITimeSeriesOptions,
  deviceTimeSeries?: ITimeSeriesOptions
) {
  return await graphQLBasicRequest(
    ` query NetworkServices($id: String!, $accountId: String${SERVICE_TIME_SERIES_PARAMS + DEVICE_TIME_SERIES_PARAMS}) {
        login {
          id
          network(id: $id)  {
            connections {
              service {
                ${SERVICE_SELECT}
                device {
                  ${DEVICE_SELECT}
                }
              }
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
          id
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

export function graphQLNetworkAdaptor(gqlConnections) {
  let devices = {}

  gqlConnections.forEach(({ service }) => {
    const id = service.device.id
    devices[id] = devices[id] || service.device
    devices[id].services = devices[id].services || []
    const index = devices[id].services.findIndex(s => s.id === service.id)
    if (index >= 0) devices[id].services[index] = service
    else devices[id].services.push(service)
  })

  return Object.keys(devices).map(key => devices[key])
}

export function graphQLDeviceAdaptor({
  gqlDevices,
  accountId,
  hidden,
  loaded,
}: {
  gqlDevices: any[]
  accountId: string
  hidden?: boolean
  loaded?: boolean
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
      version: d.version,
      geo: d.endpoint?.geo,
      license: d.license,
      permissions: d.permissions || [],
      attributes: processDeviceAttributes(d, customAttributes),
      tags: d.tags?.map(t => ({ ...t, created: new Date(t.created) })) || [],
      services: graphQLServiceAdaptor(d),
      presenceAddress: d.presenceAddress,
      notificationSettings: d.notificationSettings,
      timeSeries: processTimeSeries(d),
      access:
        d.access?.map((e: any) => ({
          id: e.user?.id,
          email: e.user?.email || e.user?.id,
          scripting: e.scripting,
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

export function graphQLServiceAdaptor(device: any): IService[] {
  return (
    device.services?.map(
      (s: any): IService => ({
        id: s.id,
        type: s.title,
        state: s.state,
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
  let columns = DEVICE_PRELOAD_ATTRIBUTES
  columns = columns.concat(selectedColumns)
  columns = columns.filter(c => (filter ? !filter.includes(c) : true))
  return attributeQuery(columns)
}

function attributeQuery(attributes: string[]) {
  let lookup = new Set<string>()
  let query = ''

  attributes.forEach(c => {
    const a = getAttribute(c)
    lookup.add(a.query || a.id)
  })

  lookup.forEach(l => {
    DeviceSelectLookup[l]
      ? (query += DeviceSelectLookup[l])
      : console.warn(`Missing query for attribute %c${l}`, 'font-weight: bold')
  })

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

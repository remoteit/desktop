import { graphQLRequest, graphQLBasicRequest } from './graphQL'
import { removeDeviceName } from '../shared/nameHelper'
import { getAttribute } from '../components/Attributes'
import { store } from '../store'

export const SERVICE_SELECT = `
  id
  name
  state
  title
  enabled
  application
  created
  lastReported
  port
  host
  type
  subdomain
  protocol
  license
  attributes
  presenceAddress
  access {
    user {
      id
      email
    }
  }`

const SERVICE_PRELOAD = `
  id
  name
  state
  title
  license
  application
  subdomain`

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
  tags (accountId: $account) {
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

  notifications: `
  notificationSettings {
    emailNotifications
    desktopNotifications
  }`,
}

export const DEVICE_SELECT = Object.keys(DeviceSelectLookup)
  .map(k => (k === 'services' ? '' : DeviceSelectLookup[k]))
  .join('')

const DEVICE_PRELOAD_ATTRIBUTES = [
  'id',
  'deviceName',
  'status',
  'permissions',
  'owner',
  'quality',
  'license',
  'services',
]

export async function graphQLFetchDeviceList({
  tag,
  size,
  from,
  state,
  sort,
  owner,
  name,
  account,
  platform,
}: gqlOptions) {
  return await graphQLRequest(
    ` query DeviceList($size: Int, $from: Int, $name: String, $state: String, $tag: ListFilter, $account: String, $sort: String, $owner: Boolean, $platform: [Int!]) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state, tag: $tag, sort: $sort, owner: $owner, platform: $platform) {
              total
              items {
                ${deviceQueryColumns()}
              }
            }
          }
        }
      }`,
    {
      tag,
      size,
      from,
      state,
      sort,
      owner,
      account,
      platform,
      name: name?.trim() || undefined,
    }
  )
}

export async function graphQLPreloadDevices(params: { account: string; ids: string[] }) {
  return await graphQLRequest(
    ` query DevicePreload($ids: [String!]!) {
        login {
          id
          account(id: $account) {
            device(id: $ids)  {
              ${attributeQuery(DEVICE_PRELOAD_ATTRIBUTES)}
            }
          }
        }
      }`,
    params
  )
}

export async function graphQLPreloadNetworks(accountId: string) {
  return await graphQLBasicRequest(
    ` query Networks($accountId: String) {
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
                  ${attributeQuery(DEVICE_PRELOAD_ATTRIBUTES)}
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
    { accountId }
  )
}

export async function graphQLFetchConnectionsAndLinks(params: { ids: string[] }) {
  return await graphQLRequest(
    ` query Connections($ids: [String!]!) {
        login {
          id
          device(id: $ids)  {
            ${attributeQuery(DEVICE_PRELOAD_ATTRIBUTES)}
          }
          links {
            url
            created
            password
            enabled
            service {
              id
              name
              subdomain
              device {
                id
                name
              }
            }
          }
        }
      }`,
    params
  )
}

/* 
  Fetches single, or array of devices across shared accounts by id
*/
export async function graphQLFetchFullDevice(id: string, account: string) {
  return await graphQLRequest(
    ` query Device($id: [String!]!, $account: String) {
        login {
          id
          device(id: $id)  {
            ${DEVICE_SELECT}
            services {
              ${SERVICE_SELECT}
            }
          }
        }
      }`,
    {
      id,
      account,
    }
  )
}

/* 
  Fetches single network across shared accounts by id
*/
export async function graphQLFetchNetworkServices(id: string, account: string) {
  return await graphQLBasicRequest(
    ` query Network($id: String!, $account: String) {
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
      account,
    }
  )
}

export async function graphQLFetchDeviceCount({ size, tag, owner, account }: gqlOptions) {
  return await graphQLBasicRequest(
    ` query DeviceCount($size: Int, $tag: ListFilter, $account: String, $owner: Boolean) {
        login {
          id
          account(id: $account) {
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
      account,
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
  let metaData = { customAttributes: new Array<string>() }
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
      createdAt: new Date(d.created),
      contactedAt: new Date(d.endpoint?.timestamp),
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
      attributes: processDeviceAttributes(d, metaData),
      tags: d.tags?.map(t => ({ ...t, created: new Date(t.created) })) || [],
      services: graphQLServiceAdaptor(d),
      notificationSettings: d.notificationSettings,
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
  store.dispatch.devices.customAttributes({ customAttributes: metaData.customAttributes })
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
        access: s.access?.map(e => ({
          email: e.user?.email || e.user?.id,
          id: e.user?.id,
        })),
      })
    ) || []
  )
}

function deviceQueryColumns() {
  let columns = DEVICE_PRELOAD_ATTRIBUTES
  columns = columns.concat(store.getState().ui.columns)
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

function processDeviceAttributes(response: any, metaData): IDevice['attributes'] {
  const attributes = processAttributes(response)
  metaData.customAttributes = metaData.customAttributes.concat(Object.keys(attributes).filter(c => c !== '$remoteit'))
  return attributes
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

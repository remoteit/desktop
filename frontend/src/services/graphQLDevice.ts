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
    protocol
    license
    attributes
    access {
      user {
        id
        email
      }
    }

    {
      login {
        email
        device(id: "80:00:00:00:01:24:9C:71") {
          id
          name
          services {
            id
            name
            connect {
              code
              url
              created
            }
          }
        }
      }
    }


`

const DeviceSelectLookup: ILookup<string> = {
  id: `
  id`,

  deviceName: `
  name
  configurable
  platform`,

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

  status: `
  state`,

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
    id
    name
    state
    title
    license
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
  .map(k => DeviceSelectLookup[k])
  .join()

export async function graphQLFetchDevices({
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
  let deviceQuery = new Set()
  let columns = ['id']
  columns = columns.concat(store.getState().ui.columns)

  console.log('DEVICE QUERY COLUMNS', columns, store.getState().ui.columns)

  columns.forEach(c => {
    const a = getAttribute(c)
    deviceQuery.add(DeviceSelectLookup[a.query || a.id])
  })

  console.log('DEVICE QUERY', deviceQuery)

  return await graphQLRequest(
    ` query Devices($size: Int, $from: Int, $name: String, $state: String, $tag: ListFilter, $account: String, $sort: String, $owner: Boolean, $platform: [Int!]) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state, tag: $tag, sort: $sort, owner: $owner, platform: $platform) {
              total
              items {
                ${Array.from(deviceQuery).join('')}
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

export async function graphQLFetchConnections(params: { account: string; ids: string[] }) {
  return await graphQLRequest(
    ` query Connections($ids: [String!]!, $account: String) {
        login {
          id
          connections: device(id: $ids)  {
            ${DEVICE_SELECT}
            services {
              ${SERVICE_SELECT}
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
export async function graphQLFetchDevice(id: string, account: string) {
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

export function graphQLDeviceAdaptor(
  gqlDevices: any[],
  loginId: string,
  accountId: string,
  hidden: boolean = false,
  loaded: boolean = false
): IDevice[] {
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
      loaded: loaded,
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
      accountId,
      hidden,
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
        enabled: s.enabled,
        typeID: s.application,
        state: s.state,
        deviceID: device.id,
        createdAt: new Date(s.created),
        lastReported: s.lastReported && new Date(s.lastReported),
        contactedAt: new Date(s.endpoint?.timestamp),
        license: s.license,
        attributes: processServiceAttributes(s),
        name: removeDeviceName(device.name, s.name),
        port: s.port,
        host: s.host,
        protocol: s.protocol,
        access: s.access?.map((e: any) => ({ email: e.user?.email || e.user?.id, id: e.user?.id })),
      })
    ) || []
  )
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

export async function graphQLRegistration(props: {
  name?: string
  services: IServiceRegistration[]
  platform?: number
  account: string
}) {
  return await graphQLBasicRequest(
    ` query Registration($account: String, $name: String, $platform: Int, $services: [ServiceInput!]) {
        login {
          account(id: $account) {
            registrationCode(name: $name, platform: $platform, services: $services)
            registrationCommand(name: $name, platform: $platform, services: $services)
          }
        }
      }`,
    props
  )
}

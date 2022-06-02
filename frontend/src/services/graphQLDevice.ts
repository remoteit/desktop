import { graphQLRequest, graphQLBasicRequest } from './graphQL'
import { removeDeviceName } from '../shared/nameHelper'
import { store } from '../store'

const DEVICE_SELECT = `
  id
  name
  state
  created
  lastReported
  hardwareId
  platform
  version
  configurable
  permissions
  license
  attributes
  tags (accountId: $account) {
    name
    color
    created
  }
  access {
    user {
      id
      email
    }
    scripting
  }
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
  }
  owner {
    id
    email
  }
  services {
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
  }
  notificationSettings {
    emailNotifications
    desktopNotifications
  }
`

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
  return await graphQLRequest(
    ` query($size: Int, $from: Int, $name: String, $state: String, $tag: ListFilter, $account: String, $sort: String, $owner: Boolean, $platform: [Int!]) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state, tag: $tag, sort: $sort, owner: $owner, platform: $platform) {
              total
              items {
                ${DEVICE_SELECT}
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
    ` query($ids: [String!]!, $account: String) {
        login {
          id
          connections: device(id: $ids)  {
            ${DEVICE_SELECT}
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
    ` query($id: [String!]!, $account: String) {
        login {
          id
          device(id: $id)  {
            ${DEVICE_SELECT}
          }
        }
      }`,
    {
      id,
      account,
    }
  )
}

export async function graphQLFetchDeviceCount({ tag, state, sort, owner, account, platform }: gqlOptions) {
  return await graphQLBasicRequest(
    ` query($state: String, $tag: ListFilter, $account: String, $sort: String, $owner: Boolean, $platform: [Int!]) {
        login {
          id
          account(id: $account) {
            devices(state: $state, tag: $tag, sort: $sort, owner: $owner, platform: $platform) {
              total
            }
          }
        }
      }`,
    {
      tag,
      state,
      sort,
      owner,
      account,
      platform,
    }
  )
}

export function graphQLAdaptor(
  gqlDevices: any[],
  loginId: string,
  accountId: string,
  hidden: boolean = false
): IDevice[] {
  if (!gqlDevices || !gqlDevices.length) return []
  const state = store.getState()
  const thisDeviceId = state.backend.device.uid
  let metaData = { customAttributes: new Array<string>() }
  let data: IDevice[] = gqlDevices?.map((d: any): IDevice => {
    const owner = d.owner || state.auth.user
    return {
      id: d.id,
      name: d.name,
      owner: owner,
      state: d.state,
      configurable: d.configurable,
      hardwareID: d.hardwareId,
      createdAt: new Date(d.created),
      contactedAt: new Date(d.endpoint?.timestamp),
      shared: loginId !== owner.id,
      lastReported: d.lastReported && new Date(d.lastReported),
      externalAddress: d.endpoint?.externalAddress,
      internalAddress: d.endpoint?.internalAddress,
      targetPlatform: d.platform,
      availability: d.endpoint?.availability,
      instability: d.endpoint?.instability,
      quality: d.endpoint?.quality,
      version: d.version,
      geo: d.endpoint?.geo,
      license: d.license,
      permissions: d.permissions,
      attributes: processDeviceAttributes(d, metaData),
      tags: d.tags.map(t => ({ ...t, created: new Date(t.created) })),
      services: d.services.map(
        (s: any): IService => ({
          id: s.id,
          type: s.title,
          enabled: s.enabled,
          typeID: s.application,
          state: s.state,
          deviceID: d.id,
          createdAt: new Date(s.created),
          lastReported: s.lastReported && new Date(s.lastReported),
          contactedAt: new Date(s.endpoint?.timestamp),
          license: s.license,
          attributes: processServiceAttributes(s),
          name: removeDeviceName(d.name, s.name),
          port: s.port,
          host: s.host,
          protocol: s.protocol,
          access: s.access.map((e: any) => ({ email: e.user?.email || e.user?.id, id: e.user?.id })),
        })
      ),
      notificationSettings: d.notificationSettings,
      access: d.access.map((e: any) => ({
        id: e.user?.id,
        email: e.user?.email || e.user?.id,
        scripting: e.scripting,
      })),
      thisDevice: d.id === thisDeviceId,
      accountId,
      hidden,
    }
  })
  store.dispatch.devices.customAttributes({ customAttributes: metaData.customAttributes })
  return data
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

export async function graphQLCreateRegistration(services: IApplicationType['id'][], account: string) {
  return await graphQLBasicRequest(
    ` query($account: String, $services: [ServiceInput!]) {
        login {
          account(id: $account) {
            registrationCommand(services: $services)
          }
        }
      }`,
    {
      account,
      services: services.map(s => ({ application: s })),
    }
  )
}

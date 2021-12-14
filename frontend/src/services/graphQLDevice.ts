import { graphQLRequest } from './graphQL'
import { removeDeviceName } from '../shared/nameHelper'
import { updateConnections } from '../helpers/connectionHelper'
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
  license
  attributes
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
  size,
  from,
  state,
  sort,
  owner,
  name,
  account,
  ids = [],
  platform,
}: gqlOptions) {
  return await graphQLRequest(
    ` query($ids: [String!]!, $size: Int, $from: Int, $name: String, $state: String, $account: String, $sort: String, $owner: Boolean, $platform: [Int!]) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state, sort: $sort, owner: $owner, platform: $platform) {
              total
              items {
                ${DEVICE_SELECT}
              }
            }
          }
          connections: device(id: $ids)  {
            ${DEVICE_SELECT}
          }
          contacts {
            id
            email
          }
        }
      }`,
    {
      ids,
      size,
      from,
      state,
      sort,
      owner,
      account,
      platform,
      name: name?.trim() ? name : undefined,
    }
  )
}

/* 
  Fetches single, or array of devices across shared accounts by id
*/
export async function graphQLFetchDevice(id: string) {
  return await graphQLRequest(
    ` query($id: [String!]!) {
        login {
          id
          device(id: $id)  {
            ${DEVICE_SELECT}
          }
        }
      }`,
    {
      id,
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
  const thisDeviceId = store.getState().backend.device.uid
  let metaData = { userAttributes: new Array<string>() }
  let data: IDevice[] = gqlDevices?.map(
    (d: any): IDevice => ({
      id: d.id,
      name: d.name,
      owner: d.owner,
      state: d.state,
      configurable: d.configurable,
      hardwareID: d.hardwareId,
      createdAt: new Date(d.created),
      contactedAt: new Date(d.endpoint?.timestamp),
      shared: loginId !== d.owner.id,
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
      attributes: processDeviceAttributes(d, metaData),
      tags: labelsToTags(d),
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
          access: s.access.map((e: any) => ({ email: e.user?.email, id: e.user?.id })),
        })
      ),
      notificationSettings: {
        emailNotifications: d.notificationSettings.emailNotifications,
        desktopNotifications: d.notificationSettings.desktopNotifications,
      },
      access: d.access.map((e: any) => ({
        id: e.user?.id,
        email: e.user?.email,
        scripting: e.scripting,
      })),
      thisDevice: d.id === thisDeviceId,
      accountId,
      hidden,
    })
  )
  store.dispatch.devices.userAttributes({ userAttributes: metaData.userAttributes })
  return updateConnections(data)
}

function processDeviceAttributes(response: any, metaData): IDevice['attributes'] {
  const attributes = processAttributes(response)
  metaData.userAttributes = metaData.userAttributes.concat(Object.keys(attributes).filter(c => c !== '$remoteit'))
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

function labelsToTags(response: any): IDevice['tags'] {
  let tags: IDevice['tags'] = []
  const attributes = processAttributes(response)
  if (attributes.color) tags.push(1000 + attributes.color)
  return tags
}

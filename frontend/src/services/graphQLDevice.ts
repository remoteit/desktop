import { graphQLRequest } from './graphQL'
import { removeDeviceName } from '../shared/nameHelper'
import { LEGACY_ATTRIBUTES } from '../shared/constants'
import { updateConnections } from '../helpers/connectionHelper'

const DEVICE_SELECT = `
  id
  name
  state
  created
  lastReported
  hardwareId
  platform
  version
  attributes
  ${LEGACY_ATTRIBUTES.join('\n')}
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
    application
    created
    lastReported
    port
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
    sessions {
      timestamp
      endpoint {
        platform
      }
      user {
        id
        email
      }
    }
  }
`

export async function graphQLFetchDevices({ size, from, state, sort, owner, name, account, ids = [] }: gqlOptions) {
  return await graphQLRequest(
    ` query($ids: [String!]!, $size: Int, $from: Int, $name: String, $state: String, $account: String, $sort: String, $owner: Boolean) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state, sort: $sort, owner: $owner) {
              total
              items {
                ${DEVICE_SELECT}
              }
            }
          }
          connections: device(id: $ids)  {
            ${DEVICE_SELECT}
          }
          member {
            created
            scripting
            user {
              id
              email
            }
          }
          access {
            created
            scripting
            user {
              id
              email
            }
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

export function graphQLAdaptor(gqlDevices: any[], loginId: string, accountId: string, hidden?: boolean): IDevice[] {
  if (!gqlDevices || !gqlDevices.length) return []
  let data: IDevice[] = gqlDevices?.map(
    (d: any): IDevice => ({
      id: d.id,
      name: d.name,
      owner: d.owner,
      state: d.state,
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
      attributes: processDeviceAttributes(d),
      services: d.services.map(
        (s: any): IService => ({
          id: s.id,
          type: s.title,
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
          protocol: s.protocol,
          access: s.access.map((e: any) => ({ email: e.user?.email, id: e.user?.id })),
          sessions: processSessions(s.sessions, loginId),
        })
      ),
      access: d.access.map((e: any) => ({
        id: e.user?.id,
        email: e.user?.email,
        scripting: e.scripting,
      })),
      accountId,
      hidden,
      events: d.events || [],
    })
  )
  return updateConnections(data)

  /* 
    Sort and filter session data
      - Sort by timestamp
      - Filter out this user's sessions
      - Combine same user sessions
  */
  function processSessions(response: any, loginId: string): IUser[] {
    const dates = response.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
    const sorted = dates.sort((a: any, b: any) => a.timestamp - b.timestamp)
    const result = sorted.reduce((sessions: IUser[], e: any) => {
      if (loginId !== e.user?.id && !sessions.some(s => s.id === e.user?.id && s.platform === e.endpoint.platform))
        sessions.push({
          id: e.user?.id,
          timestamp: e.timestamp,
          email: e.user?.email,
          platform: e.endpoint.platform,
        })
      return sessions
    }, [])
    return result
  }
}

function processDeviceAttributes(response: any): IDevice['attributes'] {
  let result = processAttributes(response)
  LEGACY_ATTRIBUTES.forEach(attribute => {
    if (response[attribute]) result[attribute] = response[attribute]
  })
  return result
}

function processServiceAttributes(response: any): IService['attributes'] {
  return processAttributes(response)
}

function processAttributes(response: any) {
  const root = response.attributes || {}
  const $ = root.$remoteit || {}
  let result = { ...root, ...$ }
  delete result.$remoteit
  return result
}

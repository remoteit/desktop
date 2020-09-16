import { graphQLRequest } from './graphQL'
import { renameServices } from '../shared/nameHelper'
import { LEGACY_ATTRIBUTES } from '../shared/constants'
import { updateConnections } from '../helpers/connectionHelper'

const DEVICE_SELECT = `{
  total
  items {
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
        email
      }
      scripting
    }
    endpoint {
      externalAddress
      internalAddress
      availability
      instability
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
      attributes
      access {
        user {
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
  }
}`

export async function graphQLFetchDevices({ size, from, state, name, ids = [] }: gqlOptions) {
  return await graphQLRequest(
    ` query($ids: [String!], $size: Int, $from: Int, $name: String, $state: String) {
        login {
          id
          devices(size: $size, from: $from, name: $name, state: $state) ${DEVICE_SELECT}
          connections: devices(id: $ids) ${DEVICE_SELECT}
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
      name: name?.trim() ? name : undefined,
    }
  )
}

export async function graphQLFetchDevice(id: string) {
  return await graphQLRequest(
    ` query($ids: [String!], $idSize: Int) {
        login {
          id
          devices(id: $ids, size: $idSize) ${DEVICE_SELECT}
        }
      }`,
    {
      idSize: 1,
      ids: [id],
    }
  )
}

export function graphQLAdaptor(gqlDevices: any, loginId: string, hidden?: boolean): IDevice[] {
  if (!gqlDevices) return []
  let data: IDevice[] = gqlDevices?.items.map(
    (d: any): IDevice => ({
      id: d.id,
      name: d.name,
      owner: d.owner?.email,
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
      version: d.version,
      geo: d.endpoint?.geo,
      attributes: processAttributes(d),
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
          attributes: s.attributes,
          name: s.name,
          port: s.port,
          protocol: s.protocol,
          access: s.access.map((e: any) => ({ email: e.user?.email })),
          sessions: processSessions(s.sessions, loginId),
        })
      ),
      access: d.access.map((e: any) => ({
        email: e.user?.email,
        scripting: e.scripting,
      })),
      hidden,
    })
  )
  return updateConnections(renameServices(data))

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
      if (
        loginId !== e.user?.id &&
        !sessions.some(s => s.email === e.user?.email && s.platform === e.endpoint.platform)
      )
        sessions.push({
          timestamp: e.timestamp,
          email: e.user?.email,
          platform: e.endpoint.platform,
        })
      return sessions
    }, [])
    return result
  }
}

function processAttributes(response: any): IDevice['attributes'] {
  let result = response.attributes
  LEGACY_ATTRIBUTES.forEach(attribute => {
    if (response[attribute]) result[attribute] = response[attribute]
  })
  return result
}

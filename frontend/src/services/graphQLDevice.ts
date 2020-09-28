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
    events {
      hasMore
      total
      items {
        id
        state
        timestamp
        type
        action
        actor {
            email
        }
        services {
            id
            name
        }
        users {
            email
        }
        ... on DeviceShareEvent {
            scripting
        }
      }
    }
  }
}`

const LOG_SELECT_FOR_DEVICE = `{
  items {
    id
    events(from: $from, maxDate: $maxDate) {
      hasMore
      total
      items {
        id
        state
        timestamp
        type
          action
          actor {
              email
          }
          services {
              id
              name
          }
          users {
              email
          }
          ... on DeviceShareEvent {
              scripting
          }
      }
    }
  }`

export async function graphQLFetchDevices({ size, from, state, name, account, ids = [] }: gqlOptions) {
  return await graphQLRequest(
    ` query($ids: [String!]!, $size: Int, $from: Int, $name: String, $state: String, $account: String) {
        login {
          id
          account(id: $account) {
            devices(size: $size, from: $from, name: $name, state: $state) {
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

export async function graphQLGetMoreLogs(id: string, from: number, maxDate: string) {
  return await graphQLRequest(
    `
        query($ids: [String!], $from: Int, $maxDate: DateTime ) {
          login {
            id
            devices(id: $ids) ${LOG_SELECT_FOR_DEVICE}
          }
        }
      `,
    {
      maxDate,
      from,
      ids: [id],
    }
  )
}

export async function graphQLGetEventsURL(id: string, maxDate: string) {
  return await graphQLRequest(
    `
        query($ids: String!, $maxDate: DateTime ) {
          login {
            id
            device(id: $ids){
              eventsUrl( maxDate: $maxDate  )
            }
          }
        }
      `,
    {
      maxDate,
      ids: id,
    }
  )
}

export function graphQLAdaptor(gqlDevices: any[], loginId: string, hidden?: boolean): IDevice[] {
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
      hidden,
      events: d.events,
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

function processAttributes(response: any): IDevice['attributes'] {
  let result = response.attributes
  LEGACY_ATTRIBUTES.forEach(attribute => {
    if (response[attribute]) result[attribute] = response[attribute]
  })
  return result
}

import axios from 'axios'
import { r3 } from '../services/remote.it'
import { version } from '../../package.json'
import { parseType } from '../services/serviceTypes'
import { renameServices } from '../shared/nameHelper'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'
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
    attributes
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
      created
      lastReported
      port
      type
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

const CONTACT_SELECT = `
  contacts {
    id
    email
  }`

/* 
  GraphQL common request parameters
*/
function requestParams() {
  return {
    url: version.includes('alpha') ? GRAPHQL_BETA_API : GRAPHQL_API,
    method: 'post' as 'post',
    headers: { token: r3.token },
  }
}

export async function graphQLRequest(query: String, variables: ILookup) {
  const request = {
    ...requestParams(),
    data: { query, variables },
  }
  console.log('GRAPHQL REQUEST', request)
  return await axios.request(request)
}

export async function graphQLFetch({ size, from, state, name, ids = [] }: gqlOptions) {
  return await graphQLRequest(
    `
        query($ids: [String!], $idSize: Int, $size: Int, $from: Int, $name: String, $state: String) {
          login {
            id
            devices(size: $size, from: $from, name: $name, state: $state) ${DEVICE_SELECT}
            connections: devices(id: $ids, size: $idSize) ${DEVICE_SELECT}
            contacts: ${CONTACT_SELECT}
          }
        }
      `,
    {
      idSize: ids.length,
      ids,
      size,
      from,
      name,
      state,
    }
  )
}

export async function graphQLGet(id: string) {
  const request = {
    ...requestParams(),
    data: {
      query: `
        query($ids: [String!], $idSize: Int) {
          login {
            id
            devices(id: $ids, size: $idSize) ${DEVICE_SELECT}
          }
        }
      `,
      variables: {
        idSize: 1,
        ids: [id],
      },
    },
  }
  console.log('GRAPHQL SINGLE REQUEST', request)
  return await axios.request(request)
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
      availability: d.endpoint?.availability,
      instability: d.endpoint?.instability,
      geo: d.endpoint?.geo,
      attributes: d.attributes,
      services: d.services.map(
        (s: any): IService => {
          const { typeID, type } = parseType(s.type)
          return {
            type,
            typeID,
            id: s.id,
            state: s.state,
            deviceID: d.id,
            createdAt: new Date(s.created),
            lastReported: s.lastReported && new Date(s.lastReported),
            contactedAt: new Date(s.endpoint?.timestamp),
            attributes: s.attributes,
            name: s.name,
            port: s.port,
            access: s.access.map((e: any) => ({ email: e.user?.email })),
            sessions: processSessions(s.sessions, loginId),
          }
        }
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

import axios from 'axios'
import { r3 } from '../services/remote.it'
import { parseType } from '../services/serviceTypes'
import { renameServices } from '../shared/nameHelper'
import { GRAPHQL_API_URL } from '../shared/constants'
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
      access {
        user {
          email
          created
        }
      }
      sessions {
        timestamp
        user {
          id
          email
        }
      }
    }
  }
}`

export async function graphQLFetch({ size, from, state, name, ids = [] }: gqlOptions) {
  return await axios.request({
    url: GRAPHQL_API_URL,
    method: 'post',
    headers: { token: r3.token },
    data: {
      query: `
        query($ids: [String!], $idSize: Int, $size: Int, $from: Int, $name: String, $state: String) {
          login {
            id
            devices(size: $size, from: $from, name: $name, state: $state) ${DEVICE_SELECT}
            connections: devices(id: $ids, size: $idSize) ${DEVICE_SELECT}
          }
        }
      `,
      variables: {
        idSize: ids.length,
        ids,
        size,
        from,
        name,
        state,
      },
    },
  })
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
            name: s.name,
            port: s.port,
            access: s.access.map((e: any) => ({
              email: e.user?.email,
              created: new Date(e.user?.created),
            })),
            sessions: s.sessions.reduce((result: IUser[], e: any) => {
              if (loginId !== e.user?.id)
                result.push({
                  timestamp: new Date(e.timestamp),
                  email: e.user?.email,
                })
              return result
            }, []),
          }
        }
      ),
      hidden,
    })
  )
  console.log('DATA', data)
  return updateConnections(renameServices(data))
}

import axios from 'axios'
import { r3 } from '../services/remote.it'
import { parseType } from '../services/serviceTypes'
import { renameServices } from '../helpers/nameHelper'
import { GRAPHQL_API_URL } from '../constants'
import { updateConnections } from '../helpers/connectionHelper'

export async function graphQLFetch({ size, from, state = '', name = '', ids = [] }: gqlOptions) {
  console.log('GQL OPTIONS', size, from, state, name, ids)
  const connections = `connections: devices(id:${JSON.stringify(ids)})`
  const devices = `devices(size:${size}, from:${from}, name:"${name}", state: "${state}")`
  const select = `
  {
    total
    items {
      id
      name
      state
      created
      hardwareId
      lastReported
      owner {
        id
      }
      services {
        name
        id
        port
        type
        created
        endpoint {
          state
        }
      }
    }
  }
  `
  return await axios.request({
    url: GRAPHQL_API_URL,
    method: 'post',
    headers: { token: r3.token },
    data: {
      query: `
        {
          login {
            id
            ${devices}${select}
            ${connections}${select}
          }
        }
      `,
    },
  })
}

export function graphQLAdaptor(gqlDevices: any, loginId: string, hidden?: boolean): IDevice[] {
  if (!gqlDevices) return []
  let data = gqlDevices?.items.map(
    (d: any): IDevice => {
      const services = d.services.reduce((result: IService[], s: any): IService[] => {
        const { typeID, type } = parseType(s.type)
        if (typeID !== 35)
          result.push({
            type,
            typeID,
            contactedAt: new Date(s.endpoint?.timestamp),
            createdAt: new Date(s.created),
            deviceID: d.id,
            id: s.id,
            lastExternalIP: '',
            name: s.name,
            port: s.port,
            protocol: '',
            region: '',
            state: s.endpoint?.state,
          })
        return result
      }, [])

      return {
        id: d.id,
        name: d.name,
        owner: d.owner.email,
        state: d.state,
        hardwareID: d.hardwareId,
        createdAt: new Date(d.created),
        contactedAt: new Date(d.endpoint?.timestamp),
        shared: loginId !== d.owner.id,
        lastReported: new Date(d.lastReported),
        lastExternalIP: '',
        lastInternalIP: '',
        region: '',
        services,
        hidden,
      }
    }
  )

  return updateConnections(renameServices(data))
}

import { graphQLBasicRequest } from './graphQL'
import { getApiURL } from '../helpers/apiHelper'

type Support = { available: boolean; namedAddress: boolean }

export type ServiceShortcut = {
  id: string
  name: string
  state: IDevice['state'] | 'unlicensed'
  enabled: boolean
  application: number
  subnetName?: string | null
  subnetOwnName?: boolean
  subnetPort?: number | null
  device: { id: string; name: string }
}

let probe: { url: string; result: Promise<Support | 'ERROR'> } | undefined

export function serviceShortcutsSupport() {
  const url = getApiURL() || ''
  if (probe?.url === url) return probe.result

  const result = graphQLBasicRequest(
    `query ServiceShortcutsSchema {
      user: __type(name: "User") { fields { name } }
      service: __type(name: "Service") { fields { name } }
      mutation: __type(name: "Mutation") { fields { name } }
    }`,
    {},
    true
  ).then((response): Support | 'ERROR' => {
    if (response === 'ERROR') {
      if (probe?.result === result) probe = undefined
      return 'ERROR'
    }
    const data = response.data?.data
    const has = (type: string, field: string) =>
      Boolean(data?.[type]?.fields?.some((entry: { name: string }) => entry.name === field))
    return {
      available:
        has('user', 'serviceShortcuts') && has('service', 'showInServices') && has('mutation', 'setShowInServices'),
      namedAddress: ['subnetName', 'subnetOwnName', 'subnetPort'].every(field => has('service', field)),
    }
  })
  probe = { url, result }
  return result
}

export async function graphQLServiceShortcuts(
  accountId: string,
  namedAddress: boolean
): Promise<ServiceShortcut[] | 'ERROR'> {
  const response = await graphQLBasicRequest(
    `query ServiceShortcuts($accountId: String!) {
      login { account(id: $accountId) {
        serviceShortcuts {
          id name state enabled application
          ${namedAddress ? 'subnetName subnetOwnName subnetPort' : ''}
          device { id name }
        }
      } }
    }`,
    { accountId },
    true
  )
  if (response === 'ERROR') return response
  return response.data?.data?.login?.account?.serviceShortcuts ?? 'ERROR'
}

export async function graphQLShowInServices(serviceId: string): Promise<boolean | 'ERROR'> {
  const response = await graphQLBasicRequest(
    `query ShowInServices($ids: [String!]!) {
      login { service(id: $ids) { showInServices } }
    }`,
    { ids: [serviceId] },
    true
  )
  if (response === 'ERROR') return response
  return response.data?.data?.login?.service?.[0]?.showInServices ?? 'ERROR'
}

export async function graphQLSetShowInServices(serviceId: string, visible: boolean): Promise<boolean> {
  const response = await graphQLBasicRequest(
    `mutation SetShowInServices($serviceId: String!, $visible: Boolean!) {
      setShowInServices(serviceId: $serviceId, visible: $visible)
    }`,
    { serviceId, visible },
    true
  )
  return response !== 'ERROR' && response.data?.data?.setShowInServices === true
}

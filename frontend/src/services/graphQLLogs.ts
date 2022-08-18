import { graphQLRequest, graphQLBasicRequest } from './graphQL'

const EVENTS = `
    events(from: $from, size: $size, minDate: $minDate, maxDate: $maxDate) {
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
        target {
          id
          name
          device {
            id
            name
          }
        }
        users {
          email
        }
        devices {
          id
          name
        }
        ... on DeviceShareEvent {
          scripting
        }
      }
    }`

const EVENTS_URL = 'eventsUrl(minDate: $minDate, maxDate: $maxDate)'

export async function graphQLGetDeviceLogs(id: string, from: number, size: number, minDate: Date, maxDate: Date) {
  return await graphQLBasicRequest(
    `  query DeviceLogs($id: [String!]!, $from: Int, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
          login {
            id
            device(id: $id) {  
              id
              ${EVENTS}
            }
          }
        }
      `,
    {
      id,
      from,
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
      size,
    }
  )
}

export async function graphQLGetLogs(account: string, from: number, size: number, minDate: Date, maxDate: Date) {
  return await graphQLBasicRequest(
    `  query Logs($account: String!, $from: Int, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
          login {
            account(id: $account) {
              id
              ${EVENTS}
            }
          }
        }
      `,
    {
      account,
      from,
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
      size,
    }
  )
}

export async function graphQLGetDeviceUrl(id: string, minDate: Date, maxDate: Date) {
  return await graphQLRequest(
    `   query DeviceLogsUrl($id: [String!]!, $minDate: DateTime, $maxDate: DateTime) {
          login {
            id
            device(id: $id) {  
              id
              ${EVENTS_URL}
            }
          }
        }
      `,
    {
      id,
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
    }
  )
}

export async function graphQLGetUrl(minDate: Date, maxDate: Date) {
  return await graphQLRequest(
    `   query LogsUrl($minDate: DateTime, $maxDate: DateTime) {
          login {
            id
            ${EVENTS_URL}
          }
        }
      `,
    {
      minDate: minDate.toISOString(),
      maxDate: maxDate.toISOString(),
    }
  )
}

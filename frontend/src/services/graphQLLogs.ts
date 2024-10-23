import { graphQLBasicRequest } from './graphQL'

const EVENTS = `
    events(after: $after, size: $size, minDate: $minDate, maxDate: $maxDate) {
      hasMore
      last
      total
      items {
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
        ... on DeviceJobEvent {
          job {
            file {
              name
            }
          }
        }
        ... on JobEvent {
          job {
            file {
              name
            }
          }
        }
      }
    }`

const EVENTS_URL = 'eventsUrl(minDate: $minDate, maxDate: $maxDate)'

export async function graphQLGetDeviceLogs(id: string, size: number, after?: string, minDate?: Date, maxDate?: Date) {
  return await graphQLBasicRequest(
    `  query DeviceLogs($id: [String!]!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
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
      after,
      minDate: minDate?.toISOString(),
      maxDate: maxDate?.toISOString(),
      size,
    }
  )
}

export async function graphQLGetLogs(account: string, size: number, after?: string, minDate?: Date, maxDate?: Date) {
  return await graphQLBasicRequest(
    `  query Logs($account: String!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
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
      after,
      minDate: minDate?.toISOString(),
      maxDate: maxDate?.toISOString(),
      size,
    }
  )
}

export async function graphQLGetDeviceUrl(id: string, minDate?: Date, maxDate?: Date) {
  return await graphQLBasicRequest(
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
      minDate: minDate?.toISOString(),
      maxDate: maxDate?.toISOString(),
    }
  )
}

export async function graphQLGetUrl(minDate?: Date, maxDate?: Date) {
  return await graphQLBasicRequest(
    `   query LogsUrl($minDate: DateTime, $maxDate: DateTime) {
          login {
            id
            ${EVENTS_URL}
          }
        }
      `,
    {
      minDate: minDate?.toISOString(),
      maxDate: maxDate?.toISOString(),
    }
  )
}

import { graphQLBasicRequest } from './graphQL'

const EVENTS = `
    events(after: $after, size: $size, minDate: $minDate, maxDate: $maxDate, types: $types) {
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

const EVENTS_URL = 'eventsUrl(minDate: $minDate, maxDate: $maxDate, types: $types)'

const CONNECTION_USAGE_EVENTS = `
    events(
      after: $after
      size: $size
      minDate: $minDate
      maxDate: $maxDate
      types: [DEVICE_CONNECT]
    ) {
      items {
        timestamp
        state
        actor {
          email
        }
        target {
          id
        }
        ... on DeviceConnectEvent {
          session
          txBytes
          rxBytes
          lifetime
        }
      }
    }`

const DEVICE_CONNECTION_USAGE_EVENTS = `
    events(
      after: $after
      size: $size
      minDate: $minDate
      maxDate: $maxDate
      types: [DEVICE_CONNECT]
    ) {
      items {
        timestamp
        state
        ... on DeviceConnectEvent {
          session
          txBytes
          rxBytes
          lifetime
        }
      }
    }`

export async function graphQLGetDeviceLogs(
  id: string,
  size: number,
  after?: string,
  minDate?: Date,
  maxDate?: Date,
  types?: IEventType[]
) {
  return await graphQLBasicRequest(
    `  query DeviceLogs($id: [String!]!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime, $types: [EventType!]) {
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
      types,
    }
  )
}

export async function graphQLGetLogs(
  account: string,
  size: number,
  after?: string,
  minDate?: Date,
  maxDate?: Date,
  types?: IEventType[]
) {
  return await graphQLBasicRequest(
    `  query Logs($account: String!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime, $types: [EventType!]) {
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
      types,
    }
  )
}

export async function graphQLGetDeviceUrl(id: string, minDate?: Date, maxDate?: Date, types?: IEventType[]) {
  return await graphQLBasicRequest(
    `   query DeviceLogsUrl($id: [String!]!, $minDate: DateTime, $maxDate: DateTime, $types: [EventType!]) {
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
      types,
    }
  )
}

export async function graphQLGetUrl(account: string, minDate?: Date, maxDate?: Date, types?: IEventType[]) {
  return await graphQLBasicRequest(
    `   query LogsUrl($account: String!, $minDate: DateTime, $maxDate: DateTime, $types: [EventType!]) {
          login {
            account(id: $account) {
              id
            ${EVENTS_URL}
            }
          }
        }
      `,
    {
      account,
      minDate: minDate?.toISOString(),
      maxDate: maxDate?.toISOString(),
      types,
    }
  )
}

export async function graphQLGetConnectionUsage(
  account: string,
  size: number,
  after?: string,
  minDate?: Date,
  maxDate?: Date
) {
  return await graphQLBasicRequest(
    `  query ConnectionUsage($account: String!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
          login {
            account(id: $account) {
              id
              ${CONNECTION_USAGE_EVENTS}
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

export async function graphQLGetDeviceConnectionUsage(
  id: string,
  size: number,
  after?: string,
  minDate?: Date,
  maxDate?: Date
) {
  return await graphQLBasicRequest(
    `  query DeviceConnectionUsage($id: [String!]!, $after: ID, $size: Int, $minDate: DateTime, $maxDate: DateTime) {
          login {
            id
            device(id: $id) {
              id
              ${DEVICE_CONNECTION_USAGE_EVENTS}
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

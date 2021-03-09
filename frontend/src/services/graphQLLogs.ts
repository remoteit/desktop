import { graphQLRequest } from './graphQL'

const EVENTS = `
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
      }`

export async function graphQLGetMoreLogs(id: string, from?: number, maxDate?: string, minDate?: string) {
  return await graphQLRequest(
    `  query($id: [String!]!, $from: Int, $maxDate: DateTime, $minDate: DateTime ) {
          login {
            id
            device(id: $id) {
              id
              events(from: $from, maxDate: $maxDate, minDate: $minDate) {
                ${EVENTS}
              }
            }
          }
        }
      `,
    {
      maxDate,
      minDate,
      from,
      id,
    }
  )
}

export async function graphQLGetEventsURL(id: string, maxDate?: string, minDate?: String) {
  return await graphQLRequest(
    `  query($ids: [String!]!, $maxDate: DateTime ) {
          login {
            id
            device(id: $ids){
              eventsUrl( maxDate: $maxDate  )
            }
          }
        }`,
    {
      maxDate,
      minDate,
      ids: id,
    }
  )
}

export async function graphQLGetLogsURL(types: [string, string], minDate?: string) {
  return await graphQLRequest(
    `
      query getLogsUrl($types: [EventType!], $minDate: DateTime) {
        login {
          id
          eventsUrl(types: $types, minDate: $minDate)
        }
      }
    `,
    {
      types,
      minDate,
    }
  )
}

export async function graphQLGetEventsLogs(from?: number, minDate?: string) {
  return await graphQLRequest(
    `  query($from: Int, $minDate: DateTime) {
          login {
            id
            events( from: $from, minDate: $minDate) {
              ${EVENTS}
            }
          }
        }
      `,
    {
      from,
      minDate,
    }
  )
}

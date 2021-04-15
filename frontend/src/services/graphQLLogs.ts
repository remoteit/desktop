import { graphQLRequest } from './graphQL'

const EVENTS = `
  events(from: $from, maxDate: $maxDate, minDate: $minDate) {
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
      }
    }`

export async function graphQLGetMoreLogs(id: string, from?: number, maxDate?: string, minDate?: string) {
  return await graphQLRequest(
    `  query($id: [String!]!, $from: Int, $maxDate: DateTime, $minDate: DateTime ) {
          login {
            id
            device(id: $id) {
              id
              eventsUrl( maxDate: $maxDate, minDate: $minDate )
              ${EVENTS}
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


export async function graphQLGetEventsLogs(from?: number, minDate?: string, maxDate?: string) {
  return await graphQLRequest(
    `  query($from: Int, $maxDate: DateTime, $minDate: DateTime) {
          login {
            id
            ${EVENTS}
            eventsUrl( minDate: $minDate, maxDate: $maxDate)
          }
        }
      `,
    {
      from,
      minDate,
      maxDate,
    }
  )
}

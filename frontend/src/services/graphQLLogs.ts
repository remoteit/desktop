import { graphQLRequest } from './graphQL'

const LOG_SELECT_FOR_DEVICE = `
  {
    id
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
        ... on DeviceShareEvent {
          scripting
        }
      }
    }
  }`

export async function graphQLGetMoreLogs(id: string, from?: number, maxDate?: string, minDate?: string) {
  return await graphQLRequest(
    `  query($id: [String!]!, $from: Int, $maxDate: DateTime, $minDate: DateTime ) {
          login {
            id
            device(id: $id) ${LOG_SELECT_FOR_DEVICE}
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

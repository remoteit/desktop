import { post } from './post'

/* Whether the API counts an exit's devices (graphql-api docs/PROXY-GROUPS.md §13, Exit.serving; said in words by
   helpers/exitServingHelper): asked only where the API has it, read from its schema once (as services/deviceSignIns) —
   the portal meets graphqls without it, where a query naming it would fail. */

export type { ExitServing } from '../helpers/exitServingHelper'

const PROBE = `query ExitServingFields { exit: __type(name: "Exit") { fields { name } } }`
const FIELDS = 'serving { devices carrying healthy draining }'

let schema: Promise<string> | undefined

// The fields an exit's query adds for its devices counted: none where the API lacks them.
export const parseExitServing = (data: any): string =>
  (data?.exit?.fields || []).some((field: { name: string }) => field.name === 'serving') ? FIELDS : ''

// Read once; asked again after a failed request.
export function exitServingFields(): Promise<string> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return ''
      }
      return parseExitServing(response.data?.data)
    })
  return schema
}

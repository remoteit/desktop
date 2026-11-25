import { graphQLGetErrors } from './graphQL'
import { httpsOnly } from '../helpers/utilHelper'
import { oidcSignIns } from './oidc'
import { post } from './post'

// What asking for a ticket came to: where to go back to with it; refused — the person, or the link itself, whoever asks —;
// or not answered — the network, the server —, which may be asked again.
export type EndpointTicket = { url: string } | 'REFUSED' | 'GONE' | 'FAILED'

// graphql's refusals for who is asking, which another person's sign-in may not meet.
const ACCESS = ['NO_ACCESS', 'NOT_AUTHORIZED']
// Its refusal of what is asked for: an endpoint that is gone, or a return address that is not its own.
const INVALID = 'INVALID_ARGUMENT'

/* A ticket for a signed-in endpoint, with several sign-ins in use: asked as the page's own person, and where they may not
   use it as each other in turn, up to the first who may — so one ticket at most is given, and a refusal leaves nothing
   behind (graphql notes a sign-in with the ticket it gives). Only a refusal of the person asks the next: a request that
   failed is no one's refusal. Who is signed in is read from what they are kept in (services/oidc), not from the accounts
   read for them since: a bookmark opens this before any of those are. */
export async function endpointTicket(endpointId: string, returnUrl: string): Promise<EndpointTicket> {
  const asked = new Set<string>()
  // The page's own person, then each other in use. Read as each is asked for: one may have been signed in meanwhile.
  const next = () => oidcSignIns().find(signIn => !signIn.primary && !asked.has(signIn.sub))?.sub
  for (let sub: string | undefined = ''; sub !== undefined; ) {
    asked.add(sub)
    const answer = await ask(endpointId, returnUrl, sub, () => next() === undefined)
    if (answer !== 'REFUSED') return answer
    sub = next()
  }
  return 'REFUSED'
}

async function ask(endpointId: string, returnUrl: string, sub: string, last: () => boolean): Promise<EndpointTicket> {
  const query = ` mutation EndpointTicket($endpointId: String!, $returnUrl: String!) {
          endpointTicket(endpointId: $endpointId, returnUrl: $returnUrl)
        }`
  const variables = { endpointId, returnUrl }
  const response = await post({ query, variables }, '', false, false, { sub })
  if (response === 'ERROR') return 'FAILED'
  const codes: string[] | undefined = response.data?.errors?.map((error: any) => error.extensions?.code ?? '')
  const refused = !!codes?.some(code => ACCESS.includes(code))
  // Shown as any error is, where it is the last word: a refusal of one while another is to be asked is not.
  const errors = graphQLGetErrors(response, refused && !last(), { query, variables })
  if (errors) return refused ? 'REFUSED' : codes?.includes(INVALID) ? 'GONE' : 'FAILED'
  const url = httpsOnly(response.data?.data?.endpointTicket)
  return url ? { url } : 'FAILED'
}

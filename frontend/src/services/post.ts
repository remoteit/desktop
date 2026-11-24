import axios, { AxiosResponse } from 'axios'
import { getApiRestURL, getApiURL } from '../helpers/apiHelper'
import { apiRequest } from './remoteit'
import { store } from '../store'
import {
  actingFor,
  requestSignIn,
  requestServing,
  servingChanged,
  servingGone,
  RequestFor,
  Serving,
} from '../selectors/signIns'
import network from './Network'
import sleep from '../helpers/sleep'

let errorCount = 0

export function resetErrorCount() {
  errorCount = 0
}

/* `requestFor` says whose request this is where the request itself does not: the account it asks about, or the
   sign-in outright. Without it the sign-in is read from the request (selectors/signIns requestSignIn): the account
   its variables name, else the account that holds what they name, else the page's own person. */
export async function post(
  data: ILookup<any, string> = {},
  path: string = '',
  silent = false,
  retry = false,
  requestFor?: RequestFor,
  asked = 0,
  // A retry of a request dropped in flight: the sign-in it was asked as, and who served its accounts then.
  retried?: { sub: string | undefined; serving: Serving | undefined }
): Promise<AxiosResponse | 'ERROR'> {
  if (store.getState().ui.offline) return 'ERROR'
  // Sent by an effect that said the row it acts for (sendAs): that row's sign-in's, read before anything is awaited.
  requestFor = retried ? requestFor : actingFor(requestFor)
  const sub = retried ? retried.sub : requestSignIn(store.getState(), requestFor, data?.variables)
  // A read: its answer is only good while the sign-ins that served its accounts still do (requestServing) — those
  // that did when it was FIRST asked, through a retry made as that same sign-in.
  const serving = retried
    ? retried.serving
    : isRead(data?.query)
    ? requestServing(store.getState(), requestFor, data?.variables)
    : undefined

  // graphql at its URL; a REST route (a path) under the API's REST root (getApiRestURL: on the unified front, /api).
  const url = (path ? getApiRestURL() : getApiURL()) + path
  try {
    const response = await apiRequest(
      'POST',
      url,
      async headers => (headers ? axios.request({ url, method: 'post', headers, data }) : undefined),
      sub
    )
    if (!response) {
      console.warn('Unable to get token for API request.', data)
      return 'ERROR'
    }
    if (serving && servingChanged(store.getState(), serving)) {
      /* The answer is the sign-in before's. Where the request itself says whose it is (the account it names, what it
         is about) it is asked again, as the sign-in that serves the account now, and THAT is what is answered — so
         whoever waits for this read gets what a read made now would give, never an error that could land over the
         newer answer. One said to be a particular sign-in's (asked once per sign-in), or about an account no one
         here serves any more, has nothing to be asked again as: it fails, and what is stored stays as it is. */
      const again = requestFor?.sub === undefined && asked < STALE_ASKS && !servingGone(store.getState(), serving)
      console.log(`POST ANSWER DROPPED: ASKED AS THE SIGN-IN BEFORE${again ? ' — ASKED AGAIN' : ''}`, { data, path })
      return again ? await post(data, path, silent, retry, requestFor, asked + 1) : 'ERROR'
    }
    return response
  } catch (error) {
    if (retry && droppedInFlight(error)) {
      console.warn('POST DROPPED, RETRYING', { data, path })
      await sleep(1000)
      return await post(data, path, silent, false, requestFor, asked, { sub, serving })
    }
    console.error('POST ERROR', { data, path })
    await apiError(error, silent)
    return 'ERROR'
  }
}

// How many times a read is asked again because its account's sign-in changed while it was out.
const STALE_ASKS = 2

// A graphql query, as against a mutation or a REST call: what only reads.
const isRead = (query: unknown) => typeof query === 'string' && /^\s*(query\b|\{)/.test(query)

// Chromium drops in-flight requests with ERR_NETWORK_CHANGED when the OS network shifts (as on the
// relaunch after an update); axios sees only a Network Error with no response.
function droppedInFlight(error: unknown) {
  return axios.isAxiosError(error) && !error.response && error.code === 'ERR_NETWORK'
}

export async function postFile(
  file: File,
  data: ILookup<any, string> = {},
  path: string = '',
  requestFor?: RequestFor
) {
  const form = new FormData()

  form.append('file', file)
  Object.entries(data).forEach(([key, value]) => {
    form.append(key, value)
  })

  return await post(form, path, false, false, requestFor)
}

export async function apiError(error: unknown, silent = false) {
  const { ui, auth } = store.dispatch
  console.error('API ERROR:', error)
  console.trace()
  errorCount = errorCount + 1

  if (axios.isAxiosError(error)) {
    console.error('AXIOS ERROR DETAILS:', { ...error })

    if (!navigator.onLine) network.offline()

    if (error.response?.status === 429) {
      if (!silent)
        ui.set({
          errorMessage:
            'API request failure. Your API usage has been throttled. Check the usage on your account and if issues persist please contact support.',
        })
      return
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Migration reality: legacy endpoints and edge path-allowlists answer 401/403 with
      // the session perfectly alive. NEVER tear down from here — checkSession consults
      // the OIDC truth (a dead refresh family) and only then signs out LOCALLY; nothing
      // on a failure path may end the AS session. Log the URL: it names the offender.
      console.warn('AUTH-SHAPED API ERROR', { url: error.config?.url, status: error.response?.status })
      await sleep(1000 * errorCount * errorCount)
      // The status rides along: under a SUPPORT session a 401 is terminal (no refresh token, the
      // session is gone) while a 403 is an ordinary refused write — checkSession tells them apart.
      auth.checkSession({ status: error.response?.status })
    }
  }

  if (!silent && (error instanceof Error || axios.isAxiosError(error))) {
    ui.set({ errorMessage: error.message })
  }
}

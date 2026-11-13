import { useSyncExternalStore } from 'react'
import { oidcPicture, oidcSubscribe } from '../services/oidc'

/** The picture of an account signed in on this browser, re-read whenever the account registry changes. */
export const useAccountPicture = (email?: string) => useSyncExternalStore(oidcSubscribe, () => oidcPicture(email))

import { accountStore } from './useAccountStore'
import { graphQLAccountExits } from '../services/graphQLExits'
import { graphQLAccountProxies } from '../services/graphQLProxy'

/* The active account's own exits and those shared with it, and its own proxies: each list's, read again by the page
   beside it after a change there (hooks/useAccountStore.ts). */
export const useAccountExits = accountStore(graphQLAccountExits)
export const useAccountProxies = accountStore(graphQLAccountProxies)

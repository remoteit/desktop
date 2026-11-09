import { accountStore } from './useAccountStore'
import { graphQLAccountExits } from '../services/graphQLExits'
import { graphQLAccountProxies, graphQLProxyBase } from '../services/graphQLProxy'

/* The active account's own exits and those shared with it, its own proxies, and its base for their names: each one's,
   read again by the page beside it after a change there (hooks/useAccountStore.ts). */
export const useAccountExits = accountStore(graphQLAccountExits)
export const useAccountProxies = accountStore(graphQLAccountProxies)
export const useAccountProxyBase = accountStore(graphQLProxyBase)

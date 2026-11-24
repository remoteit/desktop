/* What is kept of an account OUTSIDE the store — a hook's or a service's own map by account id — is read as whichever
   sign-in served the account then. When the account's stored data is dropped (models/accounts forgetData: its sign-in
   left, or another serves it from now on) these are dropped with it: each says here how. */
type Forget = (accountIds: string[]) => void

const caches = new Set<Forget>()

export const accountCache = (forget: Forget) => void caches.add(forget)

export const forgetAccountCaches = (accountIds: string[]) => caches.forEach(forget => forget(accountIds))

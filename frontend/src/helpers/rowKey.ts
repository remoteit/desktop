/* A ROW: one account as one signed-in person sees it. With several sign-ins in use an organization two of them belong
   to is a row under each (selectors/organizations selectSwitcherRows), and what the store keeps of an account it keeps
   by row — each row its own devices, in its own role — so both stay loaded and neither is ever shown as the other.

   A row's key is the account's id for the page's own person, exactly as the store has always been keyed: with one
   account signed in nothing is keyed differently, and what was stored before still loads. Only another sign-in's row
   has a key of its own. This is the only place that knows what a key looks like: everything else makes one with
   rowKey and reads one with rowAccount and rowSub, and an account's id stays an account's id everywhere outside the
   store's indexing — what graphql is asked with, what ids from it are compared to. */

export type RowKey = string & { readonly __row: unique symbol }

const SEPARATOR = '~'

/** The row of an account under a sign-in ('' or none: the page's own person). */
export const rowKey = (accountId: string, sub?: string): RowKey =>
  (sub ? `${accountId}${SEPARATOR}${sub}` : accountId) as RowKey

/** The account a row is of. */
export const rowAccount = (key: string): string => {
  const at = key.indexOf(SEPARATOR)
  return at < 0 ? key : key.slice(0, at)
}

/** The sign-in a row is under: '' the page's own person. */
export const rowSub = (key: string): string => {
  const at = key.indexOf(SEPARATOR)
  return at < 0 ? '' : key.slice(at + SEPARATOR.length)
}

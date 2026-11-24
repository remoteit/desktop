import browser from '../services/browser'
import type { AccountRoute } from '../selectors/signIns'
import { subOf } from '../selectors/signIns'

/* A CONNECTION RECORD IS A SERVICE'S, AS ONE SIGN-IN. `connection.id` is the service's id — what is sent to the
   server, and compared with a service — and with `connection.sub` (the sign-in it was made as, '' the page's own
   person) it says which record: a service two rows here both hold can have a connection from each, each made, listed,
   ended and forgotten as its own sign-in. A record that says no sign-in was stored before they were said: the page's
   own person's where they belong to its account (selectors/signIns subOf).

   WITH A BACKEND (the desktop app's own service, browser.hasBackend) there is ONE connection per service, as ever: its
   connections are kept by the service's id alone, on its side. So there every record of a service is the same record
   (recordSub answers '' for all), and a second row finds — and acts on — the connection the first made, not one of
   its own. */
export const recordSub = (routes: ILookup<AccountRoute>, connection: Pick<IConnection, 'accountId' | 'sub'>): string =>
  browser.hasBackend ? '' : subOf(routes, connection.accountId, connection.sub)

/** Whether two are the same record: the same service, as the same sign-in. */
export const sameRecord = (
  routes: ILookup<AccountRoute>,
  a: Pick<IConnection, 'id' | 'accountId' | 'sub'>,
  b: Pick<IConnection, 'id' | 'accountId' | 'sub'>
) => a.id === b.id && recordSub(routes, a) === recordSub(routes, b)

/** The record of a service that a row sees: its own sign-in's (`sub`). With none of its own, and only where the row
 *  does not itself hold the service (`holds`), one of an account that is not the row's (`accountId`) — a service of
 *  another account here, connected as that account is looked at. Never the other row's of the same account; and a
 *  service the row holds is connected to as the row, with a record of its own, not through another sign-in's. */
export function pickRecord(
  routes: ILookup<AccountRoute>,
  connections: IConnection[],
  id: string | undefined,
  accountId: string,
  sub: string,
  holds = false
): IConnection | undefined {
  if (!id) return undefined
  const records = connections.filter(c => c.id === id)
  if (browser.hasBackend) return records[0]
  const own = records.find(c => recordSub(routes, c) === sub)
  if (own || holds) return own
  return records.find(c => !!c.accountId && c.accountId !== accountId)
}

/** Whether a row's device list has the service, or the device, of this id. */
export const rowHolds = (devices: IDevice[] | undefined, id?: string): boolean =>
  !!id && !!devices?.some(device => device.id === id || device.services?.some(service => service.id === id))

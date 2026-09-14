import React, { useEffect, useRef, useState } from 'react'
import { Dispatch, State } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectDeviceListAttributes, selectDeviceModelAttributes, selectVisibleDevices } from '../selectors/devices'
import { getConnectionsLookup } from '../selectors/connections'
import { selectCanRegister } from '../selectors/organizations'
import { selectDefaultAccountId } from '../selectors/accounts'
import { restoreAttributes } from '../components/Attributes'
import { DeviceListEmpty } from '../components/DeviceListEmpty'
import { LoadingMessage } from '../components/LoadingMessage'
import { DevicesDrawers } from '../components/DevicesDrawers'
import { RegisterMenu } from '../components/RegisterMenu'
import { DeviceList } from '../components/DeviceList'
import { ServiceList } from '../components/ServiceList'
import { DevicesHeader } from '../components/DevicesHeader'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const { accounts } = useDispatch<Dispatch>()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const { attributes, required } = useSelector(selectDeviceListAttributes)
  const { fetching: deviceFetching, initialized, applicationTypes } = useSelector(selectDeviceModelAttributes)
  const devices = useSelector(selectVisibleDevices)
  const canRegister = useSelector(selectCanRegister)
  const defaultAccountId = useSelector(selectDefaultAccountId)
  const connections = useSelector(getConnectionsLookup)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const selected = useSelector((state: State) => state.ui.selected)
  const fetching = useSelector((state: State) => state.ui.fetching) || deviceFetching

  // initLoad so only a list that loaded during this mount redirects, initialized so it
  // has actually finished - a switched-to account swaps in an empty, unloaded model.
  const shouldRedirect = initLoad && initialized && canRegister

  /* An empty list means "add your first device" only once it has actually loaded — so
     arm on the way down and redirect on the way up, never both in one pass. The latch is
     deliberate and STICKY: `devices` is persisted, so a page that mounts already
     `initialized` from storage never arms it — stale persisted emptiness must not bounce a
     reload to /add, and a membership that lands mid-session must not yank the user to that
     org. Only a load observed during this mount (a fresh sign-in, an expired or unloaded
     account's fetch) arms it, and from then on every re-run re-decides. The trigger must
     include the inputs the decision reads — the empty-list and default-account signals —
     because on a fresh sign-in the memberships arrive after the list does, changing the
     answer without touching `initialized`. A ref keyed to the account we acted for keeps
     that from re-selecting or re-pushing /add on every re-run. */
  // Guard by the ACTIVE account, not defaultAccountId: on a personal account with no memberships
  // defaultAccountId is undefined, so keying on it would make the guard `undefined !== undefined`
  // (never redirect to /add) and could not tell one chosen account from the next. activeAccountId
  // is always set and changes on every switch, so each account decides exactly once.
  const activeAccountId = useSelector((state: State) => state.accounts.activeId || state.user.id)
  const actedFor = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length && actedFor.current !== activeAccountId) {
      actedFor.current = activeAccountId
      if (defaultAccountId) accounts.select(defaultAccountId)
      else history.push('/add')
    }
  }, [initialized, shouldRedirect, devices.length, defaultAccountId, activeAccountId, history, accounts])

  return (
    <DevicesDrawers>
      <RegisterMenu buttonSize={56} fontSize={22} fab />
      <DevicesHeader select={select} devices={devices}>
        {(!initialized || fetching) && !devices.length ? (
          <LoadingMessage />
        ) : !devices.length ? (
          <DeviceListEmpty />
        ) : !restore && applicationTypes?.length ? (
          <ServiceList
            {...{
              attributes,
              applicationTypes,
              required,
              devices,
              connections,
              columnWidths,
              fetching,
              select,
              selected,
            }}
          />
        ) : (
          <DeviceList
            attributes={restore ? restoreAttributes : attributes}
            {...{ required, devices, connections, columnWidths, fetching, restore, select, selected }}
          />
        )}
      </DevicesHeader>
    </DevicesDrawers>
  )
}

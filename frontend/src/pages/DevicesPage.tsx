import React, { useEffect, useState } from 'react'
import { State } from '../store'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectDeviceListAttributes, selectDeviceModelAttributes, selectVisibleDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { getConnectionsLookup } from '../selectors/connections'
import { selectPermissions } from '../selectors/organizations'
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
  /* WHICH account's list we watched load, not merely THAT one did. As a bare boolean
     this armed on the first load and never disarmed, so it outlived the account it was
     set for: switching back to an already-loaded empty account left `shouldRedirect`
     true, and since it also draws the spinner, a finished empty list spun forever. */
  const [loadingAccount, setLoadingAccount] = useState<string>()
  const { attributes, required } = useSelector(selectDeviceListAttributes)
  const { fetching: deviceFetching, initialized, applicationTypes } = useSelector(selectDeviceModelAttributes)
  const devices = useSelector(selectVisibleDevices)
  const accountId = useSelector(selectActiveAccountId)
  const permissions = useSelector(selectPermissions)
  const connections = useSelector(getConnectionsLookup)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const selected = useSelector((state: State) => state.ui.selected)
  const fetching = useSelector((state: State) => state.ui.fetching) || deviceFetching

  const shouldRedirect = loadingAccount === accountId && permissions.includes('MANAGE')

  /* An empty list means "add your first device" only once it has actually loaded — so
     arm on the way down and redirect on the way up, never both in one pass. Keyed to
     the account and re-run when the list empties, so every switch re-decides instead
     of inheriting the last account's answer. */
  useEffect(() => {
    if (!initialized) setLoadingAccount(accountId)
    else if (shouldRedirect && !devices.length) history.push('/add')
  }, [accountId, initialized, shouldRedirect, devices.length, history])

  return (
    <DevicesDrawers>
      <RegisterMenu buttonSize={56} fontSize={22} fab />
      <DevicesHeader select={select} devices={devices}>
        {(!initialized || fetching || shouldRedirect) && !devices.length ? (
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

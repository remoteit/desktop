import React, { useEffect, useState } from 'react'
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
     arm on the way down and redirect on the way up, never both in one pass. Keyed to
     the account and re-run when the list empties, so every switch re-decides instead
     of inheriting the last account's answer. */
  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      if (defaultAccountId) accounts.select(defaultAccountId)
      else history.push('/add')
    }
  }, [initialized, history])

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

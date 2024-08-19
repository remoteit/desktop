import React, { useEffect, useState } from 'react'
import { State } from '../../store'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectDeviceListAttributes, selectDeviceModelAttributes, selectVisibleDevices } from '../../selectors/devices'
import { getConnectionsLookup } from '../../selectors/connections'
import { selectPermissions } from '../../selectors/organizations'
import { restoreAttributes } from '../../components/Attributes'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesDrawers } from '../../components/DevicesDrawers'
import { RegisterMenu } from '../../components/RegisterMenu'
import { DeviceList } from '../../components/DeviceList'
import { ServiceList } from '../../components/ServiceList'
import { DevicesHeader } from '../../components/DevicesHeader'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const { attributes, required } = useSelector(selectDeviceListAttributes)
  const { fetching: deviceFetching, initialized, applicationTypes } = useSelector(selectDeviceModelAttributes)
  const devices = useSelector(selectVisibleDevices)
  const permissions = useSelector(selectPermissions)
  const connections = useSelector(getConnectionsLookup)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const selected = useSelector((state: State) => state.ui.selected)
  const fetching = useSelector((state: State) => state.ui.fetching) || deviceFetching

  const shouldRedirect = initLoad && permissions?.includes('MANAGE')

  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      history.push('/add')
    }
  }, [initialized, history])

  return (
    <DevicesDrawers>
      <RegisterMenu buttonSize={56} fontSize={22} fab />
      <DevicesHeader selected={selected} select={select} devices={devices}>
        {(fetching || shouldRedirect) && !devices.length ? (
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

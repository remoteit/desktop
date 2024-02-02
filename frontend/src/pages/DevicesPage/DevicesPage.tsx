import React, { useEffect, useState } from 'react'
import { State } from '../../store'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectDeviceListAttributes, selectDeviceModelAttributes, selectVisibleDevices } from '../../selectors/devices'
import { selectPermissions } from '../../selectors/organizations'
import { getConnectionsLookup } from '../../selectors/connections'
import { restoreAttributes } from '../../components/Attributes'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesDrawers } from '../../components/DevicesDrawers'
import { DeviceList } from '../../components/DeviceList'
import { ServiceList } from '../../components/ServiceList'
import { DevicesHeader } from '../../components/DevicesHeader'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const { attributes, required } = useSelector(selectDeviceListAttributes)
  const { fetching: fetch, initialized, applicationTypes } = useSelector(selectDeviceModelAttributes)
  const devices = useSelector(selectVisibleDevices)
  const permissions = useSelector(selectPermissions)
  const connections = useSelector(getConnectionsLookup)
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const selected = useSelector((state: State) => state.ui.selected)
  const fetching = useSelector((state: State) => state.ui.fetching) || fetch

  const shouldRedirect = initLoad && permissions?.includes('MANAGE')

  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      history.push('/add')
    }
  }, [initialized, history])

  return (
    <DevicesDrawers>
      <DevicesHeader selected={selected} select={select} devices={devices}>
        {(fetching || shouldRedirect) && !devices.length ? (
          <LoadingMessage message="Loading..." spinner={false} />
        ) : !devices.length ? (
          <DeviceListEmpty />
        ) : !restore && applicationTypes?.length ? (
          <ServiceList {...{ attributes, applicationTypes, required, devices, connections, columnWidths, fetching }} />
        ) : (
          <DeviceList
            attributes={restore ? restoreAttributes : attributes}
            {...{ required, devices, connections, columnWidths, fetching, restore, select, selected }}
          />
        )}
      </DevicesHeader>
      <DialogNewFeatures />
    </DevicesDrawers>
  )
}

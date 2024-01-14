import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectPermissions } from '../../selectors/organizations'
import { getConnectionsLookup } from '../../selectors/connections'
import { masterAttributes } from '../../components/Attributes'
import { getVisibleDevices, getDeviceModel } from '../../selectors/devices'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesDrawers } from '../../components/DevicesDrawers'
import { DeviceList } from '../../components/DeviceList'
import { DevicesHeader } from '../../components/DevicesHeader'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const { selected, devices, connections, fetching, initialized, permissions, columnWidths } = useSelector(
    (state: ApplicationState) => {
      const deviceModel = getDeviceModel(state)
      return {
        selected: state.ui.selected,
        fetching: deviceModel.fetching || state.ui.fetching,
        initialized: deviceModel.initialized,
        permissions: selectPermissions(state),
        columnWidths: state.ui.columnWidths,
        devices: getVisibleDevices(state),
        connections: getConnectionsLookup(state),
      }
    }
  )

  const shouldRedirect = initLoad && permissions?.includes('MANAGE')

  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      history.push('/add')
    }
  }, [initialized])

  return (
    <DevicesDrawers>
      <DevicesHeader selected={selected} select={select} devices={devices}>
        {(fetching || shouldRedirect) && !devices.length ? (
          <LoadingMessage message={'Loading... ' + fetching + ' ' + shouldRedirect} spinner={false} />
        ) : !devices.length ? (
          <DeviceListEmpty />
        ) : (
          <DeviceList
            devices={devices}
            connections={connections}
            columnWidths={columnWidths}
            fetching={fetching}
            restore={restore}
            select={select}
            selected={selected}
          />
        )}
      </DevicesHeader>
      <DialogNewFeatures />
    </DevicesDrawers>
  )
}

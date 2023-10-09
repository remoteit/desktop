import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectPermissions } from '../../selectors/organizations'
import { getConnectionsLookup } from '../../selectors/connections'
import { masterAttributes, restoreAttributes } from '../../components/Attributes'
import { getVisibleDevices, getDeviceModel, selectMasterAttributes } from '../../selectors/devices'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { DeviceActionsBar } from '../../components/DeviceActionsBar'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesHeader } from '../../components/DevicesHeader'
import { DeviceListMemo } from '../../components/DeviceList'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const history = useHistory()
  const [initLoad, setInitLoad] = useState<boolean>(false)
  const { selected, devices, connections, fetching, initialized, permissions, columnWidths, attributes, required } =
    useSelector((state: ApplicationState) => {
      const deviceModel = getDeviceModel(state)
      return {
        selected: state.ui.selected,
        attributes: restore ? restoreAttributes : selectMasterAttributes(state),
        required: masterAttributes.find(a => a.required) || masterAttributes[0],
        fetching: deviceModel.fetching || state.ui.fetching,
        initialized: deviceModel.initialized,
        permissions: selectPermissions(state),
        columnWidths: state.ui.columnWidths,
        devices: getVisibleDevices(state),
        connections: getConnectionsLookup(state),
      }
    })

  const shouldRedirect = initLoad && permissions?.includes('MANAGE')

  useEffect(() => {
    if (!initialized) setInitLoad(true)
    if (shouldRedirect && !devices.length) {
      history.push('/add')
    }
  }, [initialized])

  return (
    <DevicesHeader>
      {(fetching || shouldRedirect) && !devices.length ? (
        <LoadingMessage message="Loading..." spinner={false} />
      ) : !devices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceActionsBar selected={selected} select={select} devices={devices}>
          <DeviceListMemo
            devices={devices}
            connections={connections}
            attributes={attributes}
            columnWidths={columnWidths}
            fetching={fetching}
            required={required}
            restore={restore}
            select={select}
            selected={selected}
          />
        </DeviceActionsBar>
      )}
      <DialogNewFeatures />
    </DevicesHeader>
  )
}

import React from 'react'
import { useSelector } from 'react-redux'
import { getConnectionsLookup } from '../../selectors/connections'
import { masterAttributes, restoreAttributes } from '../../components/Attributes'
import { getDevices, getDeviceModel, selectMasterAttributes } from '../../selectors/devices'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { DeviceActionsBar } from '../../components/DeviceActionsBar'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesHeader } from '../../components/DevicesHeader'
import { DeviceList } from '../../components/DeviceList'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const { selected, devices, connections, fetching, columnWidths, attributes, required } = useSelector(
    (state: ApplicationState) => ({
      selected: state.ui.selected,
      attributes: restore ? restoreAttributes : selectMasterAttributes(state),
      required: masterAttributes.find(a => a.required) || masterAttributes[0],
      fetching: getDeviceModel(state).fetching || state.ui.fetching,
      columnWidths: state.ui.columnWidths,
      devices: getDevices(state).filter((d: IDevice) => !d.hidden),
      connections: getConnectionsLookup(state),
    })
  )

  return (
    <DevicesHeader>
      {fetching && !devices.length ? (
        <LoadingMessage logo logoColor="grayLight" />
      ) : !devices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceActionsBar selected={selected} select={select} devices={devices}>
          <DeviceList
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

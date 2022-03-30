import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getDeviceModel } from '../../models/accounts'
import { DialogNewFeatures } from '../../components/DialogNewFeatures'
import { DeviceActionsBar } from '../../components/DeviceActionsBar'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesHeader } from '../../components/DevicesHeader'
import { DeviceList } from '../../components/DeviceList'
import { getDevices, getOwnDevices } from '../../models/accounts'
import { masterAttributes, deviceAttributes } from '../../components/Attributes'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = { restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ restore, select }) => {
  const { selected, devices, connections, myDevice, fetching, columnWidths, attributes, required } = useSelector(
    (state: ApplicationState) => ({
      selected: state.ui.selected,
      attributes: masterAttributes
        .concat(deviceAttributes)
        .filter(a => a.show(state.ui.feature) && state.ui.columns.includes(a.id) && !a.required),
      required: masterAttributes.find(a => a.required) || masterAttributes[0],
      fetching: getDeviceModel(state).fetching,
      columnWidths: state.ui.columnWidths,
      devices: getDevices(state).filter((d: IDevice) => !d.hidden),
      myDevice: getOwnDevices(state).find(device => device.id === state.backend.device.uid),
      connections: state.connections.all.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
        if (!c.deviceID) return lookup
        if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
        else lookup[c.deviceID] = [c]
        return lookup
      }, {}),
    })
  )

  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <DevicesHeader myDevice={myDevice} select={select}>
      {fetching && !devices.length ? (
        <LoadingMessage message="Loading devices..." />
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
            primary={required}
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

import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DevicesHeader } from '../../components/DevicesHeader'
import { getDevices, getOwnDevices } from '../../models/accounts'
import { DeviceList } from '../../components/DeviceList'
import { masterAttributes, deviceAttributes } from '../../helpers/attributes'

import analyticsHelper from '../../helpers/analyticsHelper'

type Props = { singlePanel?: boolean; restore?: boolean; select?: boolean }

export const DevicesPage: React.FC<Props> = ({ singlePanel, restore, select }) => {
  const { devices, connections, myDevice, fetching, attributes, required } = useSelector((state: ApplicationState) => ({
    attributes: masterAttributes.concat(deviceAttributes).filter(a => state.ui.columns.includes(a.id) && !a.required),
    required: masterAttributes.find(a => a.required),
    fetching: state.devices.fetching,
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
    myDevice: getOwnDevices(state).find(device => device.id === state.backend.device.uid),
    connections: state.connections.all.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {}),
  }))

  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <DevicesHeader fetching={fetching} singlePanel={singlePanel} myDevice={myDevice} restore={restore}>
      {fetching && !devices.length ? (
        <LoadingMessage message="Loading devices..." spinner={false} />
      ) : !devices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceList
          devices={devices}
          connections={connections}
          attributes={attributes}
          primary={required}
          restore={restore}
          myDevice={myDevice}
          select={select}
        />
      )}
    </DevicesHeader>
  )
}

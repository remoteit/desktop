import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { ServiceName } from './ServiceName'
import { ListItemLocation } from './ListItemLocation'
import { RefreshButton } from '../buttons/RefreshButton'
import { ApplicationState, Dispatch } from '../store'
import { Typography, Divider, List } from '@material-ui/core'
import { UnregisterDeviceButton } from '../buttons/UnregisterDeviceButton'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { AddUserButton } from '../buttons/AddUserButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { UsersSelect } from './UsersSelect'
import { Container } from './Container'

export const DeviceHeaderMenu: React.FC<{ device?: IDevice }> = ({ device, children }) => {
  const { thisDevice, access, connected } = useSelector((state: ApplicationState) => {
    return {
      thisDevice: state.backend.device?.uid === device?.id,
      fetching: state.devices.fetching,
      access: state.accounts.access,
      connected: state.backend.connections.find(c => c.deviceID === device?.id && c.connected),
    }
  })

  // useEffect(() => {
  //   analyticsHelper.page('ServicePage')
  //   if (!device && connection?.device.id) devices.fetchSingle({ deviceId: connection.device.id, hidden: true })
  // }, [])

  // if (!device && fetching) return <LoadingMessage message="Fetching data..." />

  if (!device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            {/* <ConnectionStateIcon device={device} connection={connected} thisDevice={thisDevice} size="lg" /> */}
            <ServiceName device={device} connection={connected} />
            <RefreshButton device={device} />
            <AddUserButton device={device} />
            {thisDevice ? <UnregisterDeviceButton device={device} /> : <DeleteButton device={device} />}
          </Typography>
          <List>
            <ListItemLocation
              title="Device Details"
              icon="info-circle"
              pathname={`/devices/${device.id}/details`}
              dense
            />
            <ListItemLocation title="Edit Device" icon="pen" pathname={`/devices/${device.id}/edit`} dense />
            <UsersSelect device={device} access={access} />
            <ListItemLocation title="Device Logs" icon="file-alt" pathname={`/devices/${device.id}/logs`} dense />
          </List>
        </>
      }
    >
      {children}
    </Container>
  )
}

const useStyles = makeStyles({
  errorMessage: { padding: 0 },
})

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { OutOfBand } from './OutOfBand'
import { makeStyles } from '@material-ui/core/styles'
import { ServiceName } from './ServiceName'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { UnregisterServiceButton } from '../buttons/UnregisterServiceButton'
import { DeleteServiceButton } from '../buttons/DeleteServiceButton'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { AddUserButton } from '../buttons/AddUserButton'
import { UsersSelect } from './UsersSelect'
import { ErrorButton } from '../buttons/ErrorButton'
import { Container } from './Container'

export const ServiceHeaderMenu: React.FC<{ device?: IDevice; service?: IService; target?: ITarget }> = ({
  device,
  service,
  target,
  children,
}) => {
  const css = useStyles()
  const { serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { connection, thisDevice, access } = useSelector((state: ApplicationState) => ({
    connection: state.backend.connections.find(c => c.id === serviceID),
    thisDevice: state.backend.device?.uid === device?.id,
    access: state.accounts.access,
  }))

  // useEffect(() => {
  //   analyticsHelper.page('ServicePage')
  //   if (!device && connection?.deviceID) devices.fetchSingle({ deviceId: connection.deviceID, hidden: true })
  // }, [])

  // if (!device && fetching) return <LoadingMessage message="Fetching data..." />

  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            {/* <ConnectionStateIcon connection={connection} service={service} thisDevice={thisDevice} size="lg" /> */}
            <ServiceName connection={connection} service={service} />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <AddUserButton device={device} />
            {thisDevice ? (
              <UnregisterServiceButton target={target} />
            ) : (
              <DeleteServiceButton device={device} service={service} />
            )}
          </Typography>
          <List>
            {!device.shared && (
              <ListItemLocation
                title="Edit Service"
                icon="pen"
                pathname={`/devices/${device.id}/${serviceID}/edit`}
                dense
              />
            )}
            <UsersSelect service={service} device={device} access={access} />
            <ListItemLocation
              title="Service Details"
              icon="info-circle"
              pathname={`/devices/${device.id}/${serviceID}/details`}
              dense
            />
          </List>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
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

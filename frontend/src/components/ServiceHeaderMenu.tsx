import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { makeStyles } from '@material-ui/core/styles'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { UnregisterServiceButton } from '../buttons/UnregisterServiceButton'
import { DeleteServiceButton } from '../buttons/DeleteServiceButton'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { AddUserButton } from '../buttons/AddUserButton'
import { UsersSelect } from './UsersSelect'
import { ErrorButton } from '../buttons/ErrorButton'
import { Container } from './Container'

export const ServiceHeaderMenu: React.FC<{
  device?: IDevice
  service?: IService
  target?: ITarget
  footer?: React.ReactElement
}> = ({ device, service, target, footer, children }) => {
  const css = useStyles()
  const { serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { connection, thisDevice, access } = useSelector((state: ApplicationState) => ({
    connection: state.backend.connections.find(c => c.id === serviceID),
    thisDevice: state.backend.device?.uid === device?.id,
    access: state.accounts.access,
  }))

  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            {/* <ConnectionStateIcon connection={connection} service={service} thisDevice={thisDevice} size="lg" /> */}
            {/* <ServiceName connection={connection} service={service} /> */}
            <Title>{service.name || 'unknown'}</Title>
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <AddUserButton device={device} />
            {thisDevice ? (
              <UnregisterServiceButton target={target} />
            ) : (
              <DeleteServiceButton device={device} service={service} />
            )}
          </Typography>
          <List>
            <ListItemLocation
              title="Service Details"
              icon="info-circle"
              pathname={`/devices/${device.id}/${serviceID}/details`}
              dense
            />
            {!device.shared && (
              <ListItemLocation
                title="Edit Service"
                icon="pen"
                pathname={`/devices/${device.id}/${serviceID}/edit`}
                dense
              />
            )}
            <UsersSelect service={service} device={device} access={access} />
          </List>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
        </>
      }
      footer={footer}
    >
      {children}
    </Container>
  )
}

const useStyles = makeStyles({
  errorMessage: { padding: 0 },
})

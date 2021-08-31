import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams, Route } from 'react-router-dom'
import { isDev } from '../services/Browser'
import { Title } from './Title'
import { OutOfBand } from './OutOfBand'
import { makeStyles } from '@material-ui/core/styles'
import { ListHorizontal } from './ListHorizontal'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { UnregisterServiceButton } from '../buttons/UnregisterServiceButton'
import { DeleteServiceButton } from '../buttons/DeleteServiceButton'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { RefreshButton } from '../buttons/RefreshButton'
import { AddUserButton } from '../buttons/AddUserButton'
import { UsersSelect } from './UsersSelect'
import { ErrorButton } from '../buttons/ErrorButton'
import { CopyButton } from '../buttons/CopyButton'
import { Container } from './Container'

export const ServiceHeaderMenu: React.FC<{
  device?: IDevice
  service?: IService
  target?: ITarget
  footer?: React.ReactNode
}> = ({ device, service, target, footer, children }) => {
  const css = useStyles()
  const { serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { connection, access } = useSelector((state: ApplicationState) => ({
    connection: state.connections.all.find(c => c.id === serviceID),
    access: state.accounts.access,
  }))

  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Typography variant="h1">
            <Title>{service.name || 'unknown'}</Title>
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <Route path="/devices/:deviceID/:serviceID/edit">
              {device.thisDevice ? (
                <UnregisterServiceButton target={target} />
              ) : (
                <DeleteServiceButton device={device} service={service} />
              )}
            </Route>
            <RefreshButton device={device} />
            <AddUserButton to={`/devices/${device.id}/${service.id}/share`} hide={device.shared} />
            <CopyButton
              icon="share-alt"
              title="Copy connection link"
              value={`${isDev() ? 'remoteitdev' : 'remoteit'}://connect/${service?.id}`}
            />
          </Typography>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} fullWidth />}
          <ListHorizontal>
            <ListItemLocation
              title="Details"
              icon="info-circle"
              iconColor="grayDarker"
              pathname={`/devices/${device.id}/${serviceID}/details`}
              dense
            />
            {!device.shared && device.state !== 'inactive' && (
              <ListItemLocation
                title="Edit"
                icon="pen"
                iconColor="grayDarker"
                pathname={`/devices/${device.id}/${serviceID}/edit`}
                dense
              />
            )}
            <UsersSelect service={service} device={device} access={access} />
          </ListHorizontal>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
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

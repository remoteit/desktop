import React, { useContext } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { DeviceContext } from '../services/Context'
import { makeStyles } from '@mui/styles'
import { getDeviceModel } from '../selectors/devices'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { DeviceTagEditor } from '../components/DeviceTagEditor'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, ListItemText, ListItemSecondaryAction, CircularProgress } from '@mui/material'
import { getSortOptions, SortServices } from '../components/SortServices'
import { ConnectionStateIcon } from '../components/ConnectionStateIcon'
import { spacing, fontSizes } from '../styling'
import { CopyAsyncMenuItem } from '../components/CopyAsyncMenuItem'
import { LicensingNotice } from '../components/LicensingNotice'
import { LinearProgress } from '../components/LinearProgress'
import { ConnectButton } from '../buttons/ConnectButton'
import { GuideBubble } from '../components/GuideBubble'
import { ServiceName } from '../components/ServiceName'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const DevicePage: React.FC = () => {
  const { connections, device } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()
  const { setupAddingService, setupDeletingService, sortService } = useSelector((state: ApplicationState) => ({
    setupAddingService: state.ui.setupAddingService,
    setupDeletingService: state.ui.setupDeletingService,
    sortService: getDeviceModel(state).sortServiceOption,
  }))

  if (!device)
    return (
      <span>
        <Notice severity="warning">Device not found.</Notice>
      </span>
    )

  const editable = device.thisDevice || (device.configurable && device.permissions.includes('MANAGE'))
  const connection = connections?.find(c => c.deviceID === device.id && c.enabled)

  // reverse sort services by creation date
  device.services.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  let servicePage = '/' + (location.pathname.split('/')[4] || 'connect')

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List>
            <ListItemLocation
              className={css.title}
              pathname={`/devices/${device.id}/details`}
              match={[
                `/devices/${device.id}/details`,
                `/devices/${device.id}/edit`,
                `/devices/${device.id}/users`,
                `/devices/${device.id}/logs`,
                `/devices/${device.id}`,
              ]}
              icon={<ConnectionStateIcon device={device} connection={connection} size="xl" />}
              onClick={() => dispatch.ui.setDefaultService({ deviceId: device.id, serviceId: null })}
              exactMatch
              title={
                <Typography variant="h3">
                  <ServiceName device={device} connection={connection} />
                </Typography>
              }
              subtitle={device.thisDevice ? 'This device' : undefined}
            />
            <DeviceTagEditor device={device} />
          </List>
          <LinearProgress loading={!device.loaded} />
        </>
      }
    >
      {device.state === 'inactive' && (
        <Notice
          gutterTop
          severity="info"
          button={
            <CopyAsyncMenuItem
              icon="wave-pulse"
              request={async () => await dispatch.devices.getRestoreCommand(device.id)}
              className={css.restore}
            />
          }
        >
          Device offline
        </Notice>
      )}
      {device.license === 'UNLICENSED' && (
        <Notice severity="warning" gutterTop>
          Device unlicensed
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>Service</Title>
        <SortServices />
        <AddFromNetwork allowScanning={device.thisDevice} button />
        <GuideBubble
          highlight
          guide="addService"
          enterDelay={400}
          placement="right"
          hide={!device || device.state === 'inactive' || !editable}
          startDate={new Date('2022-09-20')}
          queueAfter="usingConnection"
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>Add a service (application)</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                This device can be dynamically setup to host new services.
              </Typography>
            </>
          }
        >
          <AddServiceButton device={device} editable={editable} link={`/devices/${device.id}/add`} />
        </GuideBubble>
      </Typography>

      <List className={css.list}>
        {editable && <LicensingNotice instance={device} />}
        {editable && setupAddingService && (
          <ListItemLocation pathname="" disableIcon disabled dense>
            <ListItemText primary="Registering..." />
            <ListItemSecondaryAction>
              <CircularProgress color="primary" size={fontSizes.md} />
            </ListItemSecondaryAction>
          </ListItemLocation>
        )}
        <GuideBubble
          highlight
          guide="availableServices"
          enterDelay={400}
          placement="bottom"
          startDate={new Date('2022-09-20')}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>Available services</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                The device's hosted services (applications) are listed here.
              </Typography>
              <Typography variant="body2" gutterBottom>
                Select a service to configure it or to start a connection.
              </Typography>
            </>
          }
        >
          {device.services.sort(getSortOptions(sortService).sortService).map(s => {
            const c = connections?.find(c => c.id === s.id)
            let pathname = `/devices/${device.id}/${s.id}${servicePage}`
            if (pathname === location.pathname) pathname = `/devices/${device.id}/${s.id}/connect`
            return (
              <ListItemLocation
                key={s.id}
                pathname={pathname}
                match={`/devices/${device.id}/${s.id}`}
                onClick={() => dispatch.ui.setDefaultService({ deviceId: device.id, serviceId: s.id })}
                disabled={setupDeletingService === s.id}
                disableIcon
                dense
              >
                <ConnectButton
                  size="icon"
                  color="primary"
                  iconSize="base"
                  iconType="solid"
                  connection={c}
                  service={s}
                  className={css.connect}
                  permissions={device.permissions}
                  disabled={s.state === 'inactive' || device.thisDevice}
                  onClick={() => history.push(`/devices/${device.id}/${s.id}`)}
                />
                <ListItemText primary={<ServiceName service={s} connection={c} />} />
                <ListItemSecondaryAction>
                  {setupDeletingService === s.id ? (
                    <CircularProgress color="error" size={fontSizes.md} />
                  ) : (
                    <ServiceMiniState service={s} connection={c} />
                  )}
                </ListItemSecondaryAction>
              </ListItemLocation>
            )
          })}
        </GuideBubble>
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  connect: { marginLeft: -spacing.sm, marginRight: spacing.xs },
  title: { paddingTop: spacing.xs, paddingBottom: spacing.xs, marginBottom: spacing.xs },
  list: { marginRight: 1 },
  restore: { marginTop: spacing.xxs, padding: 0 },
})

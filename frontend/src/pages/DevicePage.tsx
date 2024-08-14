import React, { useContext } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { DeviceContext } from '../services/Context'
import { AddFromNetwork } from '../components/AddFromNetwork'
import { Dispatch, State } from '../store'
import { DeviceTagEditor } from '../components/DeviceTagEditor'
import { AddServiceButton } from '../buttons/AddServiceButton'
import { ListItemLocation } from '../components/ListItemLocation'
import { ServiceMiniState } from '../components/ServiceMiniState'
import { useDispatch, useSelector } from 'react-redux'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { Typography, List, ListItemText, ListItemSecondaryAction, CircularProgress } from '@mui/material'
import { getSortOptions, SortServices } from '../components/SortServices'
import { DeviceNameLocation } from '../components/DeviceNameLocation'
import { spacing, fontSizes } from '../styling'
import { NetworksIndicator } from '../components/NetworksIndicator'
import { LicensingNotice } from '../components/LicensingNotice'
import { PlanActionChip } from '../components/PlanActionChip'
import { LinearProgress } from '../components/LinearProgress'
import { ConnectButton } from '../buttons/ConnectButton'
import { JumpIndicator } from '../components/JumpIndicator'
import { RestoreModal } from '../components/RestoreModal'
import { GuideBubble } from '../components/GuideBubble'
import { DeviceName } from '../components/DeviceName'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const DevicePage: React.FC = () => {
  const { connections, device, user } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()

  const sort = useSelector(selectDeviceModelAttributes).sortServiceOption
  const setupAddingService = useSelector((state: State) => state.ui.setupAddingService)
  const setupDeletingService = useSelector((state: State) => state.ui.setupDeletingService)
  const connectThisDevice = useSelector((state: State) => state.ui.connectThisDevice)

  if (!device)
    return (
      <span>
        <Notice severity="warning">Device not found.</Notice>
      </span>
    )

  const editable = device.thisDevice || (device.configurable && device.permissions.includes('MANAGE'))
  const connection = connections?.find(c => c.deviceID === device.id && c.enabled)
  const thisDevice = device.thisDevice && device.owner.id === user.id
  const disableThisConnect = thisDevice && !connectThisDevice

  // reverse sort services by creation date
  const services = [...device.services]
  let servicePage = '/' + (location.pathname.split('/')[4] || 'connect')

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List>
            <DeviceNameLocation device={device} connection={connection} editable={editable} />
            <DeviceTagEditor device={device} />
          </List>
          <LinearProgress loading={!device.loaded} />
        </>
      }
    >
      {device.license === 'UNLICENSED' ? (
        <Notice severity="warning" button={<PlanActionChip color="warning" sx={{ marginTop: 1.4 }} />} gutterTop>
          Device unlicensed
        </Notice>
      ) : (
        device.state === 'inactive' && (
          <Notice
            gutterTop
            severity="info"
            button={
              device.permissions.includes('MANAGE') && (
                <IconButton
                  icon="wave-pulse"
                  title="Restore Device"
                  onClick={() => dispatch.ui.set({ showRestoreModal: true })}
                />
              )
            }
          >
            Device offline
          </Notice>
        )
      )}
      <Typography variant="subtitle1">
        <Title>Service</Title>
        <SortServices />
        <AddFromNetwork allowScanning={device.thisDevice} button />
        <AddServiceButton device={device} editable={editable} link={`/devices/${device.id}/add`} />
      </Typography>
      <List sx={{ '& .MuiListItem-root': { paddingRight: spacing.sm } }}>
        {editable && <LicensingNotice instance={device} />}
        {editable && setupAddingService && (
          <ListItemLocation to="" disableIcon disabled dense>
            <ListItemText primary="Registering..." />
            <ListItemSecondaryAction>
              <CircularProgress color="primary" size={fontSizes.md} />
            </ListItemSecondaryAction>
          </ListItemLocation>
        )}
        <GuideBubble
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
          {services.sort(getSortOptions(sort).sortService).map(s => {
            const c = connections?.find(c => c.id === s.id)
            let pathname = `/devices/${device.id}/${s.id}${servicePage}`
            if (pathname === location.pathname) pathname = `/devices/${device.id}/${s.id}/connect`
            return (
              <ListItemLocation
                key={s.id}
                to={pathname}
                match={`/devices/${device.id}/${s.id}`}
                onClick={() => dispatch.ui.setDefaultService({ deviceId: device.id, serviceId: s.id })}
                disabled={setupDeletingService === s.id}
                inset={1.5}
                dense
              >
                <ConnectButton
                  size="icon"
                  iconSize="base"
                  iconType="solid"
                  connection={c}
                  service={s}
                  loading={setupDeletingService === s.id}
                  color={setupDeletingService === s.id ? 'danger' : 'primary'}
                  sx={{ marginLeft: 0.375, marginRight: 0.75 }}
                  permissions={device.permissions}
                  disabled={s.state !== 'active' || disableThisConnect}
                  onClick={() => history.push(`/devices/${device.id}/${s.id}`)}
                />
                <ListItemText primary={<DeviceName service={s} connection={c} />} />
                <NetworksIndicator instance={device} service={s} />
                <JumpIndicator service={s} />
                <ServiceMiniState service={s} connection={c} />
              </ListItemLocation>
            )
          })}
        </GuideBubble>
      </List>
      <RestoreModal device={device} />
    </Container>
  )
}
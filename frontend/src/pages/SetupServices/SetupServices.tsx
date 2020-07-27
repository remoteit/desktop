import React, { useEffect } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { 
  CircularProgress, 
  Tooltip, 
  IconButton, 
  Typography, 
  Divider
} from '@material-ui/core'
import { List, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { ListItemLocation } from '../../components/ListItemLocation'
import { NetworkScanLocation } from '../../components/NetworkScanLocation'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { OutOfBand } from '../../components/OutOfBand'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { Targets } from '../../components/Targets'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  targets: ITarget[]
  device: ITargetDevice
}

export const SetupServices: React.FC<Props> = ({ device, os, targets, ...props }) => {
  const { setupBusy, setupDeletingDevice } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    setupDeletingDevice: state.ui.setupDeletingDevice,
  }))
  const { devices, ui } = useDispatch<Dispatch>()
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'
  const match = useRouteMatch()
  const history = useHistory()
  const css = useStyles()
  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })
  const onDelete = () => {
    ui.set({ setupDeletingDevice: true, setupBusy: true })
    analytics.track('deviceRemoved', { ...device, id: device.uid })
    targets.forEach(t => analytics.track('serviceRemoved', { ...t, id: t.uid }))
    emit('device', 'DELETE')
  }

  useEffect(() => {
    emit('device') // Refresh device data
  }, [])

  useEffect(() => {
    if (setupDeletingDevice && !device.uid) {
      devices.fetch() // @FIXME this will only run if the page is active
      if (match.path.includes('devices')) history.push(`/devices`)
      else history.push('/settings/setupDevice')
    }
  }, [device, devices, setupDeletingDevice, history])

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="hdd" size="lg" type="light" color="grayDarker" fixedWidth />
            <span className={css.title}>{device.name}</span>
            {setupDeletingDevice ? (
              <CircularProgress className={css.loading} size={styles.fontSizes.md} />
            ) : (
              <Tooltip title="Delete">
                <IconButton onClick={() => window.confirm(confirmMessage) && onDelete()} disabled={setupBusy}>
                  <Icon name="trash-alt" size="md" />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
        </>
      }
      // footer={
      //   <>
      //     <Divider />
      //     <NetworkScanLocation />
      //   </>
      // }
    >
      <Typography variant="subtitle1">Services</Typography>
      <section>
        <Targets device={device} targets={targets} onUpdate={onUpdate} onCancel={onCancel} {...props} />
      </section>
      <Divider />
      <DeviceActionsList deviceUID={device.uid} />
    </Container>
  )
}

type ActionType = {
  title: string,
  icon: string,
  pathname: string
}

const DeviceActionsList:React.FC<{deviceUID: string}> = ({deviceUID}) => {
  const actions: ActionType[] = [
    {title: 'Shared Users', icon:'user-friends', pathname:'/devices/setup'},
    {title: 'Edit Device', icon: 'pen', pathname:'/devices/setup'},
    {title: 'Device Details', icon:'info-circle', pathname:`/deviceDetail/${deviceUID}`}
  ];

  return (
    <List>
        {actions.map(
          action => {
            return (
              <DeviceActionListItem 
                title={action.title} 
                icon={action.icon} 
                pathname={action.pathname}
              />
            )
          }
        )}
    </List>

  )
}

const DeviceActionListItem: React.FC<ActionType> = (action) => {
  return (
    <ListItemLocation pathname={action.pathname }>
      <ListItemIcon>
        <Icon name={action.icon} size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={action.title} />
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1 },
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})

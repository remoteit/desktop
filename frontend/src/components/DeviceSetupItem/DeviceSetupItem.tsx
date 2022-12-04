import React from 'react'
import { emit } from '../../services/Controller'
import { safeHostname } from '../../shared/nameHelper'
import { getDeviceModel } from '../../selectors/devices'
import { Link, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import {
  ListItem,
  ListItemText,
  ListSubheader,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  ChipProps,
  Divider,
  Typography,
} from '@mui/material'
import { isPortal, getOs } from '../../services/Browser'
import { ListHorizontal } from '../../components/ListHorizontal'
import { getAllDevices } from '../../selectors/devices'
import { GuideBubble } from '../../components/GuideBubble'
import { DesktopUI } from '../../components/DesktopUI'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const DeviceSetupItem: React.FC<Props> = ({ className, onClick }) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const { registered, hostname, ownDevice, canRestore, restoring } = useSelector((state: ApplicationState) => ({
    registered: !!state.backend.thisId,
    hostname: safeHostname(state.backend.environment.hostname, []),
    ownDevice: getAllDevices(state).find(d => d.thisDevice && d.owner.id === state.user.id),
    restoring: state.ui.restoring,
    canRestore:
      !state.backend.thisId &&
      (getDeviceModel(state).total > getDeviceModel(state).size ||
        !!getAllDevices(state).find((d: IDevice) => d.state !== 'active' && !d.shared)),
  }))

  if (restoring)
    return (
      <ListHorizontal className={className} dense disablePadding>
        <Notice loading={true}>Restoring device...</Notice>
      </ListHorizontal>
    )

  let secondary: React.ReactNode
  let action: ChipProps | undefined
  let disabled = false

  if (registered) {
    if (ownDevice) {
      secondary = 'Already created'
    } else {
      secondary = 'This is not your system.'
      disabled = true
      // action = {
      //   label: 'unregister',
      //   onClick: () => {
      //     dispatch.ui.set({
      //       confirm: {
      //         id: 'forceUnregister',
      //         callback: () => emit('forceUnregister'),
      //       },
      //     })
      //   },
      // }
    }
  } else if (canRestore) {
    action = {
      label: 'restore',
      onClick: () => history.push('/devices/restore'),
    }
  }

  let thisLink = '/devices/setup'
  if (isPortal()) thisLink = `/add/${getOs()}`

  return (
    <DesktopUI>
      <ListHorizontal className={className} dense disablePadding>
        <ListSubheader disableGutters>Add this system</ListSubheader>
        <Divider />
        <GuideBubble
          enterDelay={400}
          guide="registerMenu"
          placement="right"
          startDate={new Date('2022-09-20')}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>Select a device</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                You can setup the device you are currently using, or follow the simple instructions to setup one of the
                commonly used platforms.
              </Typography>
            </>
          }
        >
          <ListItem button disableGutters onClick={onClick} to={thisLink} component={Link} disabled={disabled}>
            <ListItemIcon>
              <Icon name={getOs()} fixedWidth platformIcon size="xxl" />
            </ListItemIcon>
            <ListItemText primary={hostname} secondary={secondary} />
            {action && (
              <ListItemSecondaryAction>
                <Chip {...action} size="small" />
              </ListItemSecondaryAction>
            )}
          </ListItem>
        </GuideBubble>
      </ListHorizontal>
    </DesktopUI>
  )
}

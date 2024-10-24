import React from 'react'
import browser, { getOs } from '../../services/browser'
import { safeHostname } from '@common/nameHelper'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { Link, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { State } from '../../store'
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  ChipProps,
  Divider,
  Typography,
  Tooltip,
} from '@mui/material'
import { getAllDevices } from '../../selectors/devices'
import { GuideBubble } from '../../components/GuideBubble'
import { IconButton } from '../../buttons/IconButton'
import { DesktopUI } from '../../components/DesktopUI'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const DeviceSetupItem: React.FC<Props> = ({ className, onClick }) => {
  const history = useHistory()
  const registered = useSelector((state: State) => !!state.backend.thisId)
  const hostname = useSelector((state: State) => safeHostname(state.backend.environment.hostname, []))
  const ownDevice = useSelector((state: State) =>
    getAllDevices(state).find(d => d.thisDevice && d.owner.id === state.user.id)
  )
  const restoring = useSelector((state: State) => state.ui.restoring)
  const canRestore = useSelector(
    (state: State) =>
      !state.backend.thisId &&
      (selectDeviceModelAttributes(state).total > selectDeviceModelAttributes(state).size ||
        !!getAllDevices(state).find((d: IDevice) => d.state !== 'active' && !d.shared))
  )

  if (restoring)
    return (
      <List className={className} dense disablePadding>
        <Notice loading={true}>Restoring device...</Notice>
      </List>
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
    }
  } else if (canRestore) {
    action = {
      label: 'restore',
      onClick: event => {
        event.preventDefault()
        history.push('/devices/restore')
      },
    }
  }

  let thisLink = '/devices/setup'
  if (!browser.hasBackend) thisLink = `/add/${getOs()}`

  return (
    <DesktopUI>
      <List className={className} dense disablePadding>
        <ListSubheader disableGutters>
          This system
          {registered && !ownDevice && (
            <Tooltip
              title="This system is already registered to another user. You'll need to log in as the device's owner to manage it."
              placement="bottom"
              arrow
            >
              <Box position="absolute" right={0} top={0} paddingX={1}>
                <Icon name="circle-info" size="xs" />
              </Box>
            </Tooltip>
          )}
        </ListSubheader>
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
          <ListItemButton
            disableGutters
            onClick={onClick}
            to={thisLink}
            component={Link}
            disabled={disabled}
            sx={{ minWidth: 140 }}
          >
            <ListItemIcon>
              <Icon name={getOs()} fixedWidth platformIcon size="xxl" />
            </ListItemIcon>
            <ListItemText primary={hostname} secondary={secondary} />
            {action && (
              <ListItemSecondaryAction>
                <Chip {...action} size="small" variant="outlined" />
              </ListItemSecondaryAction>
            )}
          </ListItemButton>
        </GuideBubble>
      </List>
    </DesktopUI>
  )
}

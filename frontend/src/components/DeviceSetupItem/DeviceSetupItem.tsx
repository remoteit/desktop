import React from 'react'
import { useTranslation } from 'react-i18next'
import browser, { getOs } from '../../services/browser'
import { safeHostname } from '@common/nameHelper'
import { getAllDevices, selectDeviceModelAttributes } from '../../selectors/devices'
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
import { GuideBubble } from '../../components/GuideBubble'
import { DesktopUI } from '../../components/DesktopUI'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const DeviceSetupItem: React.FC<Props> = ({ className, onClick }) => {
  const { t } = useTranslation()
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
        <Notice loading={true}>{t('deviceSetupItem.restoring', 'Restoring device...')}</Notice>
      </List>
    )

  let secondary: React.ReactNode
  let action: ChipProps | undefined
  let disabled = false

  if (registered) {
    if (ownDevice) {
      secondary = t('deviceSetupItem.alreadyCreated', 'Already created')
    } else {
      secondary = t('deviceSetupItem.notYourSystem', 'This is not your system.')
      disabled = true
    }
  } else if (canRestore) {
    action = {
      label: t('deviceSetupItem.restore', 'restore'),
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
          {t('deviceSetupItem.thisSystem', 'This system')}
          {registered && !ownDevice && (
            <Tooltip
              title={t(
                'deviceSetupItem.alreadyRegistered',
                "This system is already registered to another user. You'll need to log in as the device's owner to manage it."
              )}
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
                <b>{t('deviceSetupItem.guideTitle', 'Select a device')}</b>
              </Typography>
              <Typography variant="body2" gutterBottom>
                {t(
                  'deviceSetupItem.guideBody',
                  'You can setup the device you are currently using, or follow the simple instructions to setup one of the commonly used platforms.'
                )}
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

import React from 'react'
import browser, { windowOpen } from '../services/Browser'
import { safeHostname } from '@common/nameHelper'
import { Link, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { List, ListItem, ListItemText, ListSubheader, ListItemIcon, Divider, Typography } from '@mui/material'
import { getAllDevices } from '../selectors/devices'
import { GuideBubble } from '../components/GuideBubble'
import { MobileUI } from '../components/MobileUI'
import { Icon } from '../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const AndroidSetup: React.FC<Props> = ({ className, onClick }) => {
  const history = useHistory()
  const { registered, hostname, ownDevice } = useSelector((state: ApplicationState) => ({
    registered: !!state.backend.thisId,
    hostname: safeHostname(state.backend.environment.hostname, []),
    ownDevice: getAllDevices(state).find(d => d.thisDevice && d.owner.id === state.user.id),
    restoring: state.ui.restoring,
  }))

  let secondary: React.ReactNode
  let disabled = false

  if (registered) {
    if (ownDevice) {
      secondary = 'Already created'
    } else {
      secondary = 'This is not your system.'
      disabled = true
    }
  }

  const handleClick = () => {
    if (browser.isAndroid)
      windowOpen('https://play.google.com/store/apps/details?id=it.remote.screenview', 'store', true)
    else history.push('/add/android')
    onClick?.()
  }

  return (
    <MobileUI android>
      <List className={className} dense disablePadding>
        <ListSubheader disableGutters>This system</ListSubheader>
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
                You can setup your Android device, or follow the simple instructions to setup one of the commonly used
                platforms.
              </Typography>
            </>
          }
        >
          <ListItem button disableGutters onClick={handleClick} component={Link} disabled={disabled}>
            <ListItemIcon>
              <Icon name="android" fixedWidth platformIcon size="xxl" />
            </ListItemIcon>
            <ListItemText primary={hostname} secondary={secondary} />
          </ListItem>
        </GuideBubble>
      </List>
    </MobileUI>
  )
}

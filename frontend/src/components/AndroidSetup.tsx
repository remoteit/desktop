import React from 'react'
import browser, { windowOpen } from '../services/browser'
import { SCREEN_VIEW_APP_LINK } from '../constants'
import { useHistory } from 'react-router-dom'
import { List, ListItemButton, ListItemText, ListSubheader, ListItemIcon, Typography } from '@mui/material'
import { GuideBubble } from '../components/GuideBubble'
import { MobileUI } from '../components/MobileUI'
import { Icon } from '../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const AndroidSetup: React.FC<Props> = ({ className, onClick }) => {
  const history = useHistory()

  const handleClick = () => {
    if (browser.isAndroid) windowOpen(SCREEN_VIEW_APP_LINK, 'store', true)
    else history.push('/add/android')
    onClick?.()
  }

  return (
    <MobileUI android>
      <List className={className} dense disablePadding>
        <ListSubheader disableGutters>This system</ListSubheader>
        <GuideBubble
          enterDelay={400}
          guide="registerMenu"
          placement="bottom"
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
          <ListItemButton disableGutters onClick={handleClick}>
            <ListItemIcon>
              <Icon name="android" fixedWidth platformIcon size="xxl" />
            </ListItemIcon>
            <ListItemText primary="This device" secondary="Control or access this device and local network" />
          </ListItemButton>
        </GuideBubble>
      </List>
    </MobileUI>
  )
}

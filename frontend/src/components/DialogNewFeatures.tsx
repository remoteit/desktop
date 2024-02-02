import React from 'react'
import browser, { windowOpen } from '../services/Browser'
import { MOBILE_LAUNCH_DATE, SCREEN_VIEW_APP_LINK } from '../constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Icon } from '../components/Icon'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
} from '@mui/material'

export const DialogNewFeatures = () => {
  const dispatch = useDispatch<Dispatch>()
  const mobileWelcome = useSelector((state: State) => state.ui.mobileWelcome)
  const user = useSelector((state: State) => state.user)

  // if user was created after launch don't show welcome dialog
  if (!browser.isMobile || !mobileWelcome || !user.created || user.created > MOBILE_LAUNCH_DATE) return null

  const onClose = () => dispatch.ui.setPersistent({ mobileWelcome: false })
  const handleOpenScreenView = () => windowOpen(SCREEN_VIEW_APP_LINK, 'store', true)

  return (
    <Dialog
      open
      sx={{ zIndex: 2000 }}
      PaperProps={{
        sx: {
          bgcolor: 'guide.main',
          color: 'white.main',
          '& .MuiTypography-root.MuiListItemText-secondary, & .MuiListItemIcon-root': {
            color: 'grayLightest.main',
          },
        },
      }}
      onClose={onClose}
    >
      <DialogTitle>Welcome!</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          We're excited to bring the great desktop and web Remote.It application to your mobile device.
        </Typography>
        <List>
          <ListItem disableGutters>
            <ListItemIcon>
              <Icon name="party-horn" size="lg" type="light" />
            </ListItemIcon>
            <ListItemText
              primary="Fully Featured"
              secondary="Full organization, network, and connection management. Along with service graphs and a universal interface."
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon>
              <Icon name="globe" size="lg" type="light" />
            </ListItemIcon>
            <ListItemText
              primary="Public URLs"
              secondary="Create and manage persistent URLs for all your web services."
            />
          </ListItem>
          {browser.isAndroid ? (
            <ListItem disableGutters>
              <ListItemButton onClick={handleOpenScreenView}>
                <ListItemIcon sx={{ marginTop: -4 }}>
                  <Icon name="wave-pulse" size="lg" type="light" />
                </ListItemIcon>
                <ListItemText
                  primary="Register this device"
                  secondary={
                    <>
                      You can now register this device with our new Screen View app. &nbsp;
                      <em>If you had previously registered, you can restore the old device using it's restore code.</em>
                      <br />
                      <Button
                        onClick={handleOpenScreenView}
                        variant="contained"
                        size="small"
                        color="inherit"
                        endIcon={<Icon name="google-play" type="brands" size="xs" fixedWidth />}
                        sx={{ color: 'guide.main', marginTop: 1 }}
                      >
                        Get Screen-View
                      </Button>
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          ) : (
            <ListItem disableGutters>
              <ListItemIcon>
                <Icon name="plug" size="lg" type="light" />
              </ListItemIcon>
              <ListItemText
                primary="Socket-Link"
                secondary="Create and manage all your socket-link keys for full SDK control."
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ color: 'white.main', borderWidth: 0.5 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

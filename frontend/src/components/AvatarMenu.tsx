import React from 'react'
import analyticsHelper from '../helpers/analyticsHelper'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'
import { ButtonBase, Divider, Menu } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectLicenseIndicator } from '../models/plans'
import { ListItemLocation } from './ListItemLocation'
import { ListItemSetting } from './ListItemSetting'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from './DesktopUI'
import { Avatar } from './Avatar'
import { emit } from '../services/Controller'

export const AvatarMenu: React.FC = () => {
  const [open, setOpen] = React.useState<boolean>(false)
  const [altMenu, setAltMenu] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const { user, remoteUI, preferences, backendAuthenticated, licenseIndicator } = useSelector(
    (state: ApplicationState) => ({
      user: state.auth.user,
      remoteUI: isRemoteUI(state),
      preferences: state.backend.preferences,
      backendAuthenticated: state.auth.backendAuthenticated,
      licenseIndicator: selectLicenseIndicator(state),
    })
  )

  const css = useStyles()
  const handleClose = () => {
    setOpen(false)
    setAltMenu(false)
  }
  const handleOpen = event => {
    if (event.altKey && event.shiftKey) setAltMenu(true)
    setOpen(true)
  }

  return (
    <>
      <ButtonBase onClick={handleOpen} ref={buttonRef}>
        <Avatar email={user?.email} size={42} button tooltip></Avatar>
      </ButtonBase>
      <span className={css.email}>{user?.email}</span>
      <Menu
        open={open}
        anchorEl={buttonRef.current}
        className={css.menu}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        // getContentAnchorEl={null}
        disableScrollLock
        elevation={2}
      >
        <div>
          <ListItemLocation dense title="Account" icon="user" pathname="/account" onClick={handleClose} />
          <ListItemLocation
            dense
            title="Settings"
            icon="sliders-h"
            pathname="/settings"
            badge={licenseIndicator}
            onClick={handleClose}
          />
        </div>
        <ListItemLink
          title="Support"
          icon="life-ring"
          href="https://link.remote.it/documentation-desktop/overview"
          dense
        />
        <ListItemLink title="APIs" icon="books" href="https://link.remote.it/docs/api" dense />{' '}
        {altMenu && (
          <ListItemSetting
            confirm
            label="Enable Test UI"
            icon="vial"
            confirmTitle="Are you sure?"
            confirmMessage="Enabling alpha features may be unstable. It is only intended for testing and development."
            onClick={() => {
              emit('preferences', { ...preferences, testUI: 'HIGHLIGHT' })
              handleClose()
            }}
          />
        )}
        <Divider />
        <DesktopUI>
          <ListItemSetting
            confirm
            label="Lock application"
            icon="lock"
            confirmTitle="Are you sure?"
            confirmMessage="Locking the app will leave all active connections and hosted services running and prevent others from signing in."
            onClick={() => {
              emit('user/lock')
              analyticsHelper.track('signOutLock')
            }}
          />
        </DesktopUI>
        <ListItemSetting
          confirm={backendAuthenticated}
          label="Sign out"
          icon="sign-out"
          confirmMessage="Signing out will allow this device to be transferred or another user to sign in. It will stop all connections."
          onClick={() => {
            dispatch.auth.signOut()
            analyticsHelper.track('signOut')
          }}
        />
        {remoteUI || (
          <DesktopUI>
            <ListItemSetting
              confirm
              label="Quit"
              icon="power-off"
              confirmTitle="Are you sure?"
              confirmMessage="Quitting will not close your connections."
              onClick={() => emit('user/quit')}
            />
          </DesktopUI>
        )}
      </Menu>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  label: {
    display: 'flex',
  },
  menu: {
    '& .MuiMenu-list': {
      minWidth: 200,
      backgroundColor: palette.white.main,
    },
  },
  email: { color: palette.grayDark.main, marginLeft: spacing.sm },
}))

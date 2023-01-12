import React from 'react'
import { makeStyles } from '@mui/styles'
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
  const { user, remoteUI, backendAuthenticated, licenseIndicator } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    remoteUI: isRemoteUI(state),
    backendAuthenticated: state.auth.backendAuthenticated,
    licenseIndicator: selectLicenseIndicator(state),
  }))

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
        <Avatar email={user?.email} size={44} button tooltip></Avatar>
      </ButtonBase>
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
        <ListItemLocation
          title="Bug Report"
          icon="bug"
          pathname="/feedback"
          onClick={async () => {
            await dispatch.feedback.set({
              subject: 'Bug Report',
              data: { location: window.location.href },
            })
            handleClose()
          }}
          dense
        />
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
              dispatch.ui.setPersistent({ testUI: 'HIGHLIGHT' })
              handleClose()
            }}
          />
        )}
        {/* <ListItemLink
          title="System Status &nbsp; &nbsp; "
          icon="badge-check"
          href="https://link.remote.it/documentation-desktop/overview"
          dense
        /> */}
        <Divider />
        <DesktopUI>
          <ListItemSetting
            confirm
            label="Lock application"
            icon="lock"
            confirmTitle="Are you sure?"
            confirmMessage="Locking the app will leave all active connections and hosted services running and prevent others from signing in."
            onClick={() => emit('user/lock')}
          />
        </DesktopUI>
        <ListItemSetting
          confirm={backendAuthenticated}
          label="Sign out"
          icon="sign-out"
          confirmMessage="Signing out will allow this device to be transferred or another user to sign in. It will stop all connections."
          onClick={() => dispatch.auth.signOut()}
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
  menu: { '& .MuiMenu-list': { backgroundColor: palette.white.main } },
}))

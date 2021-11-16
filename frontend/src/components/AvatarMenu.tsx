import React from 'react'
import analyticsHelper from '../helpers/analyticsHelper'
import { makeStyles, ButtonBase, Divider, Tooltip, Menu } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from './ListItemSetting'
import { colors, spacing } from '../styling'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from './DesktopUI'
import { PortalUI } from './PortalUI'
import { Avatar } from './Avatar'
import { emit } from '../services/Controller'

export const AvatarMenu: React.FC = () => {
  const [el, setEl] = React.useState<HTMLButtonElement | null>()
  const [altMenu, setAltMenu] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dispatch = useDispatch<Dispatch>()
  const { user, remoteUI, preferences, backendAuthenticated } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    remoteUI: isRemoteUI(state),
    preferences: state.backend.preferences,
    backendAuthenticated: state.auth.backendAuthenticated,
  }))

  const css = useStyles()
  const handleClose = () => {
    setEl(null)
    setAltMenu(false)
  }
  const handleOpen = event => {
    if (event.altKey && event.shiftKey) setAltMenu(true)
    setEl(buttonRef.current)
  }

  return (
    <>
      <Tooltip title={user?.email || 'Sign in'} placement="right">
        <ButtonBase onClick={handleOpen} ref={buttonRef}>
          <Avatar email={user?.email} button />
        </ButtonBase>
      </Tooltip>
      <Menu
        open={Boolean(el)}
        anchorEl={el}
        className={css.menu}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        getContentAnchorEl={null}
        disableScrollLock
        elevation={2}
      >
        <ListItemSetting
          label="Account"
          icon="user"
          onClick={() => window.open('https://link.remote.it/portal/account')}
        />
        <ListItemSetting
          label="Support"
          icon="life-ring"
          onClick={() => window.open('https://link.remote.it/documentation-desktop/overview')}
        />
        <ListItemSetting
          label="Documentation"
          icon="books"
          onClick={() => window.open('https://link.remote.it/docs/api')}
        />
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
        <PortalUI>
          <ListItemSetting
            label="Switch to Legacy View"
            icon="history"
            onClick={() => (window.location.href = 'https://app.remote.it/#devices')}
          />
          <Divider />
        </PortalUI>
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
        <DesktopUI>
          {remoteUI || <Divider />}
          {remoteUI || (
            <ListItemSetting
              confirm
              label="Quit"
              icon="power-off"
              confirmTitle="Are you sure?"
              confirmMessage="Quitting will not close your connections."
              onClick={() => emit('user/quit')}
            />
          )}
        </DesktopUI>
      </Menu>
    </>
  )
}

const useStyles = makeStyles({
  label: {
    display: 'flex',
  },
  avatar: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: colors.white,
    '&:hover': { borderColor: colors.primaryLight },
  },
  menu: {
    '& .MuiMenu-list': {
      backgroundColor: colors.white,
    },
    '& .MuiListItem-root': {
      paddingLeft: 0,
      paddingRight: spacing.lg,
    },
  },
})

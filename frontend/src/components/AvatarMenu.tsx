import React from 'react'
import analyticsHelper from '../helpers/analyticsHelper'
import { makeStyles, ButtonBase, Divider, Tooltip, Menu } from '@material-ui/core'
import { ApplicationState } from '../store'
import { ListItemSetting } from './ListItemSetting'
import { colors, spacing } from '../styling'
import { useSelector } from 'react-redux'
import { isRemoteUI } from '../helpers/uiHelper'
import { version } from '../../package.json'
import { Avatar } from './Avatar'
import { emit } from '../services/Controller'

export interface Props {}

export const AvatarMenu: React.FC<Props> = ({}) => {
  const [el, setEl] = React.useState<HTMLButtonElement | null>()
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const { user, remoteUI } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    remoteUI: isRemoteUI(state),
  }))

  const css = useStyles()
  const handleClose = () => setEl(null)
  const handleOpen = () => setEl(buttonRef.current)

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
          label="Documentation"
          icon="books"
          onClick={() => window.open('https://link.remote.it/documentation-desktop/overview')}
        />
        <ListItemSetting
          label="Feedback"
          icon="envelope"
          onClick={() =>
            (window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`))
          }
        />
        <Divider />
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
        <ListItemSetting
          confirm
          label="Sign out"
          icon="sign-out"
          confirmMessage="Signing out will allow this device to be transferred or another user to sign in. It will stop all connections."
          onClick={() => {
            emit('user/sign-out')
            analyticsHelper.track('signOut')
          }}
        />
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

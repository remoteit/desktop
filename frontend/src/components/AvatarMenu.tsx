import React from 'react'
import analyticsHelper from '../helpers/analyticsHelper'
import { emit } from '../services/Controller'
import { makeStyles, ButtonBase, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { ListItemSetting } from './ListItemSetting'
import { colors, spacing } from '../styling'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export interface Props {}

export const AvatarMenu: React.FC<Props> = ({}) => {
  const [el, setEl] = React.useState<HTMLElement | undefined>()
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))

  const css = useStyles()
  const handleClose = () => setEl(undefined)
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEl(event.currentTarget)
  }

  return (
    <>
      <Tooltip title={user?.email || 'Sign in'} placement="right">
        <ButtonBase onClick={handleOpen}>
          <Avatar email={user?.email} button />
        </ButtonBase>
      </Tooltip>
      <Menu
        open={Boolean(el)}
        anchorEl={el}
        className={css.menu}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        elevation={2}
      >
        {/* <MenuItem dense disableGutters  onClick={() => history.push()} > */}
        <MenuItem dense disableGutters onClick={() => window.open('https://link.remote.it/portal/account')}>
          <ListItemIcon>
            <Icon name="user" size="md" />
          </ListItemIcon>
          <ListItemText primary="Account Settings" />
        </MenuItem>
        <ListItemSetting
          label="Help documentation"
          icon="books"
          onClick={() => window.open('https://link.remote.it/documentation-desktop/overview')}
        />
        <ListItemSetting
          label="Send feedback"
          icon="envelope"
          onClick={() =>
            (window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`))
          }
        />
        <ListItemSetting
          label="Sign out"
          subLabel="Allow this device to be transferred or another user to sign in. Will stop all connections."
          icon="sign-out"
          onClick={() => {
            emit('user/sign-out')
            analyticsHelper.track('signOut')
          }}
        />
        <ListItemSetting
          confirm
          label="Lock application"
          subLabel="Sign out and prevent others from signing in."
          icon="lock"
          confirmTitle="Are you sure?"
          confirmMessage="Signing out will leave all active connections and hosted services running and prevent others from signing in."
          onClick={() => {
            emit('user/lock')
            analyticsHelper.track('signOutLock')
          }}
        />
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
    '& .MuiMenuItem-root': {
      paddingLeft: 0,
      paddingRight: spacing.lg,
    },
  },
})

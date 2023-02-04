import React from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
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

const ENTER_DELAY = 100
const LEAVE_DELAY = 200
const AVATAR_SIZE = 40

export const AvatarMenu: React.FC = () => {
  const history = useHistory()
  const [open, setOpen] = React.useState<boolean>(false)
  const [altMenu, setAltMenu] = React.useState<boolean>(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const enterTimer = React.useRef<number>()
  const leaveTimer = React.useRef<number>()
  const dispatch = useDispatch<Dispatch>()
  const { user, remoteUI, testUI, backendAuthenticated, licenseIndicator } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    remoteUI: isRemoteUI(state),
    testUI: ['ON', 'HIGHLIGHT'].includes(state.ui?.testUI || ''),
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
  const handleEnter = event => {
    clearTimeout(enterTimer.current)
    clearTimeout(leaveTimer.current)
    enterTimer.current = window.setTimeout(() => handleOpen(event), ENTER_DELAY)
  }
  const handleLeave = () => {
    clearTimeout(enterTimer.current)
    clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(handleClose, LEAVE_DELAY)
  }

  return (
    <>
      <ButtonBase onClick={handleOpen} ref={buttonRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <Avatar email={user?.email} size={AVATAR_SIZE} button active={open} />
      </ButtonBase>
      <Menu
        open={open}
        anchorEl={buttonRef.current}
        className={css.menu}
        onClose={handleClose}
        PaperProps={{ onMouseEnter: handleEnter, onMouseLeave: handleLeave }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        transitionDuration={200}
        disableAutoFocusItem
        disableScrollLock
        elevation={2}
      >
        <ListItemLocation
          dense
          title="Account"
          subtitle={user?.email}
          icon="user"
          // icon={<Avatar email={user?.email} size={24} />}
          pathname="/account"
          badge={licenseIndicator}
          onClick={handleClose}
        />
        <ListItemLocation
          dense
          exactMatch
          title="Settings"
          icon="sliders-h"
          pathname="/settings"
          onClick={handleClose}
        />
        <ListItemLocation
          title="Bug Report"
          icon="spider"
          iconType="solid"
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
        <ListItemLink title="APIs" icon="books" href="https://link.remote.it/docs/api" dense />
        {(altMenu || testUI) && (
          <ListItemSetting
            confirm={!testUI}
            label={(testUI ? '' : 'Enable ') + 'Test UI'}
            icon="vial"
            confirmTitle="Are you sure?"
            confirmMessage="Enabling alpha features may be unstable. It is only intended for testing and development."
            onClick={() => {
              dispatch.ui.setPersistent({ testUI: 'HIGHLIGHT' })
              history.push('/settings/test')
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

const useStyles = makeStyles(({ palette, spacing }) => ({
  menu: {
    '& .MuiPaper-root': {
      overflow: 'visible',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -AVATAR_SIZE - 4,
        width: AVATAR_SIZE + 4,
        height: AVATAR_SIZE + 4,
        cursor: 'pointer',
      },
    },
    '& .MuiList-root': { backgroundColor: 'transparent' },
  },
}))

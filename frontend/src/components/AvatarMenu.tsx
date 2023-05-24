import React, { useState, useRef, useCallback } from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { HIDE_SIDEBAR_WIDTH } from '../shared/constants'
import { useMediaQuery, ButtonBase, Divider, Menu } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectLicenseIndicator } from '../models/plans'
import { ListItemLocation } from './ListItemLocation'
import { ListItemSetting } from './ListItemSetting'
import { getActiveUser } from '../selectors/accounts'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from './DesktopUI'
import { Avatar } from './Avatar'
import { emit } from '../services/Controller'

const ENTER_DELAY = 300
const LEAVE_DELAY = 400 // must be longer than transition duration
const TRANSITION_DURATION = 200
const AVATAR_SIZE = 40
const AVATAR_BORDER = 6

export const AvatarMenu: React.FC = () => {
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  const [altMenu, setAltMenu] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const enterTimer = useRef<number>()
  const leaveTimer = useRef<number>()
  const dispatch = useDispatch<Dispatch>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const { user, remoteUI, testUI, backendAuthenticated, licenseIndicator, activeUser } = useSelector(
    (state: ApplicationState) => ({
      user: state.auth.user,
      remoteUI: isRemoteUI(state),
      testUI: ['ON', 'HIGHLIGHT'].includes(state.ui?.testUI || ''),
      backendAuthenticated: state.auth.backendAuthenticated,
      licenseIndicator: selectLicenseIndicator(state),
      activeUser: getActiveUser(state),
    })
  )

  const css = useStyles()
  const handleOpen = () => {
    window.addEventListener('keydown', checkAltMenu)
    setOpen(true)
  }
  const handleClose = () => {
    window.removeEventListener('keydown', checkAltMenu)
    setOpen(false)
    setAltMenu(false)
  }
  const handleEnter = () => {
    clearTimers()
    if (sidebarHidden) return
    enterTimer.current = window.setTimeout(handleOpen, ENTER_DELAY)
  }
  const handleLeave = () => {
    clearTimers()
    leaveTimer.current = window.setTimeout(handleClose, LEAVE_DELAY)
  }
  const clearTimers = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current)
      enterTimer.current = undefined
    }
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = undefined
    }
  }
  const checkAltMenu = useCallback((event: KeyboardEvent) => {
    if (event.altKey && event.shiftKey) setAltMenu(true)
  }, [])

  return (
    <>
      <ButtonBase onClick={handleOpen} ref={buttonRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <Avatar email={user?.email || activeUser.email} size={AVATAR_SIZE} active={open} button />
      </ButtonBase>
      <Menu
        open={open}
        anchorEl={buttonRef.current}
        className={css.menu}
        onClose={handleClose}
        PaperProps={{ onMouseEnter: handleEnter, onMouseLeave: handleLeave }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        transitionDuration={TRANSITION_DURATION}
        disableAutoFocusItem
        disableScrollLock
        elevation={2}
      >
        <ListItemLocation
          dense
          title="Account"
          subtitle={user?.email}
          icon="user"
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
            confirmProps={{
              title: 'Are you sure?',
              children: 'Enabling alpha features may be unstable. It is only intended for testing and development.',
            }}
            onClick={() => {
              dispatch.ui.setPersistent({ testUI: 'HIGHLIGHT' })
              history.push('/settings/test')
              handleClose()
            }}
          />
        )}
        {/* <Divider />
        <OrganizationSelectList /> */}
        <Divider />
        <DesktopUI>
          <ListItemSetting
            confirm
            label="Lock application"
            icon="lock"
            onClick={() => emit('user/lock')}
            confirmProps={{
              title: 'Are you sure?',
              children:
                'Locking the app will leave all active connections and hosted services running and prevent others from signing in.',
            }}
          />
        </DesktopUI>
        <ListItemSetting
          confirm={backendAuthenticated}
          label="Sign out"
          icon="sign-out"
          onClick={() => dispatch.auth.signOut()}
          confirmProps={{
            children:
              'Signing out will allow this device to be transferred or another user to sign in. It will stop all connections.',
          }}
        />
        {remoteUI || (
          <DesktopUI>
            <ListItemSetting
              confirm
              label="Quit"
              icon="power-off"
              onClick={() => emit('user/quit')}
              confirmProps={{
                title: 'Are you sure?',
                children: 'Quitting will not close your connections.',
              }}
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
        top: -AVATAR_SIZE - AVATAR_BORDER,
        width: AVATAR_SIZE + AVATAR_BORDER,
        height: AVATAR_SIZE + AVATAR_BORDER,
        cursor: 'pointer',
      },
    },
    '& .MuiList-root': {
      backgroundColor: 'transparent',
    },
  },
}))

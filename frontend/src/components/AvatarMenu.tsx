import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../store'
import { ButtonBase, Checkbox, Divider, Menu } from '@mui/material'
import { useHideSidebar } from '../hooks/useChatEnabled'
import { useSelector, useDispatch } from 'react-redux'
import { selectLicenseIndicator } from '../models/plans'
import { ListItemLocation } from './ListItemLocation'
import { ListItemSetting } from './ListItemSetting'
import { selectActiveUser } from '../selectors/accounts'
import { ListItemLink } from './ListItemLink'
import { isRemoteUI } from '../helpers/uiHelper'
import { DesktopUI } from './DesktopUI'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import {
  oidcAccounts,
  oidcRefreshBrowserAccounts,
  oidcSeveral,
  oidcSeveralOffered,
  oidcSubscribe,
} from '../services/oidc'
import { selectOrganizationOptions } from '../selectors/organizations'
import { emit } from '../services/Controller'
import browser from '../services/browser'
import { DESKTOP_HELP_LINK } from '../constants'

const ENTER_DELAY = 300
const LEAVE_DELAY = 400 // must be longer than transition duration
const TRANSITION_DURATION = 200
const AVATAR_SIZE = 40
const AVATAR_BORDER = 6

const readSignIns = () => ({ accounts: oidcAccounts(), several: oidcSeveral(), offered: oidcSeveralOffered() })

export const AvatarMenu: React.FC = () => {
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  // The registry's accounts and whether several are used at once, re-read after each refresh of the browser's set on
  // open.
  const [signIns, setSignIns] = useState(readSignIns)
  const { accounts, several, offered } = signIns
  const setAccounts = () => setSignIns(readSignIns())
  const [altMenu, setAltMenu] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const enterTimer = useRef<number>()
  const leaveTimer = useRef<number>()
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const sidebarHidden = useHideSidebar()
  const user = useSelector((state: State) => state.auth.user)
  const remoteUI = useSelector(isRemoteUI)
  const testUI = useSelector((state: State) => ['ON', 'HIGHLIGHT'].includes(state.ui?.testUI || ''))
  const backendAuthenticated = useSelector((state: State) => state.auth.backendAuthenticated)
  const switchConfirm = {
    title: t('agentSwitch.title', 'Switch accounts?'),
    action: t('agentSwitch.switch', 'Switch'),
    children: t('agentSwitch.message', 'Switching accounts will stop all connections.'),
  }
  const licenseIndicator = useSelector(selectLicenseIndicator)
  const activeUser = useSelector(selectActiveUser)
  // The selected organization, where more than one sign-in reaches it: the others it can be opened as.
  const shared = useSelector((state: State) =>
    selectOrganizationOptions(state).find(option => option.id === activeUser.id && option.reach)
  )

  // An account joining or leaving (here, in another tab, in the app's menu) changes the rows while the menu is up.
  useEffect(() => oidcSubscribe(setAccounts), [])
  const userAdmin = useSelector((state: State) => state.auth.user?.admin || false)
  // Who turning Use several at once off takes out of use here.
  const inUseBeside = accounts.filter(a => a.signedIn && !a.active)

  // handleOpen is reached from the hover timer, the click and every re-entry of the menu paper;
  // the browser's accounts are asked for once per opening, not per pointer crossing.
  const handleOpen = () => {
    if (!open) void oidcRefreshBrowserAccounts().finally(setAccounts)
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
        sx={{
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
        }}
        onClose={handleClose}
        slotProps={{ paper: { onMouseEnter: handleEnter, onMouseLeave: handleLeave } }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        transitionDuration={TRANSITION_DURATION}
        disableAutoFocusItem
        disableScrollLock
        elevation={2}
      >
        <ListItemLocation
          dense
          title={t('nav.account', 'Account')}
          subtitle={user?.email}
          icon="user"
          to="/account"
          badge={licenseIndicator}
          onClick={handleClose}
        />
        <ListItemLink title={t('nav.support', 'Support')} icon="life-ring" href={DESKTOP_HELP_LINK} dense />
        <ListItemLink title={t('nav.apis', 'APIs')} icon="books" href="https://link.remote.it/docs/api" dense />
        <ListItemLocation
          title={t('nav.bugReport', 'Bug Report')}
          icon="spider"
          iconType="solid"
          to="/feedback"
          onClick={async () => {
            await dispatch.feedback.set({
              subject: 'Bug Report',
              data: { location: window.location.href },
            })
            handleClose()
          }}
          dense
        />
        {userAdmin && (
          <ListItemLocation
            dense
            title={t('nav.admin', 'Admin')}
            icon="person-to-portal"
            to="/admin/users"
            onClick={handleClose}
          />
        )}
        {(altMenu || testUI) && (
          <ListItemSetting
            confirm={!testUI}
            label={testUI ? t('nav.testUI', 'Test UI') : t('nav.enableTestUI', 'Enable Test UI')}
            icon="vial"
            confirmProps={{
              title: t('common.areYouSure', 'Are you sure?'),
              children: t(
                'nav.testUIConfirm',
                'Enabling alpha features may be unstable. It is only intended for testing and development.'
              ),
            }}
            onClick={() => {
              dispatch.ui.setPersistent({ testUI: 'HIGHLIGHT' })
              history.push('/settings/test')
              handleClose()
            }}
          />
        )}
        <Divider />
        <DesktopUI>
          <ListItemSetting
            confirm
            label={t('nav.lockApplication', 'Lock application')}
            icon="lock"
            onClick={() => emit('user/lock')}
            confirmProps={{
              title: t('common.areYouSure', 'Are you sure?'),
              children: t(
                'nav.lockConfirm',
                'Locking the app will leave all active connections and hosted services running and prevent others from signing in.'
              ),
            }}
          />
        </DesktopUI>
        {/* An organization more than one sign-in reaches is one row, served by one of them: the others are offered
            here, for the row that is selected. */}
        {shared?.reach
          ?.filter(sign => sign.sub !== (shared.via?.sub || ''))
          .map(sign => (
            <ListItemSetting
              key={sign.sub}
              label={t('nav.openAs', {
                name: shared.name,
                account: sign.email,
                defaultValue: 'Open {{name}} as {{account}}',
              })}
              icon="arrow-right-arrow-left"
              onClick={async () => {
                handleClose()
                await dispatch.accounts.setVia({ accountId: shared.id, sub: sign.sub })
              }}
            />
          ))}
        {/* The accounts (services/oidc.ts registry; in an app, its shell's), the page's own person first. Emails render
            as-is (identities are not translated); the AS chooser behind "Sign in on this device" below is the way to
            ADD one.
            One used at a time: the page's person is the one selected, and a click on another switches to it — the
            page boots as them, and the account left stays saved.
            Several used at once: a check beside each. Checking one brings it into use beside the page's person — its
            rows join the organization switcher — and unchecking takes it out of use and keeps it saved. The page's
            own person is always in use.
            Either way an account's own Sign out is what forgets it. */}
        {accounts.map(a => {
          const other = !a.active
          return (
            <ListItemSetting
              key={a.sub}
              label={a.name || a.email || a.sub}
              subLabel={
                a.known ? t('nav.signedInOnBrowser', 'Signed in on this browser') : a.name && a.email ? a.email : undefined
              }
              icon={<Avatar email={a.email} picture={a.picture} fallback={a.name} size={24} border={0} />}
              confirm={!several && browser.hasBackend}
              confirmProps={switchConfirm}
              secondaryContent={
                several ? (
                  <Checkbox
                    size="small"
                    checked={a.signedIn}
                    disabled={!other}
                    tabIndex={-1}
                    readOnly
                    disableRipple
                    inputProps={{ 'aria-label': a.email || a.name || a.sub }}
                  />
                ) : (
                  !other && <Icon name="check" color="primary" fixedWidth />
                )
              }
              button={other && a.saved ? t('nav.signOut', 'Sign out') : undefined}
              onButtonClick={() => dispatch.auth.signOutAccount(a.sub)}
              secondaryContentWidth={several ? '130px' : '90px'}
              onClick={
                other
                  ? async () => {
                      if (several) return dispatch.auth.useAccount({ sub: a.sub, use: !a.signedIn })
                      handleClose()
                      await dispatch.auth.activateAccount(a.sub)
                    }
                  : undefined
              }
            />
          )
        })}
        <ListItemSetting
          label={t('nav.signInOnDevice', 'Sign in on this device')}
          icon="user-plus"
          confirm={!several && browser.hasBackend}
          confirmProps={switchConfirm}
          onClick={async () => {
            handleClose()
            await dispatch.auth.addAccount()
          }}
        />
        {/* Turning it off keeps the page's own person and takes the others out of use here: asked first, by name. */}
        {offered && (
          <ListItemSetting
            label={t('nav.useSeveral', 'Use several at once')}
            icon="users"
            toggle={several}
            confirm={several && inUseBeside.length > 0}
            confirmProps={{
              title: t('nav.useSeveralOffTitle', 'Use one account at a time?'),
              action: t('nav.useSeveralOffAction', 'Turn off'),
              children: t('nav.useSeveralOffConfirm', {
                accounts: inUseBeside.map(a => a.email || a.name || a.sub).join(', '),
                keep: user?.email || activeUser.email,
                defaultValue:
                  'This signs out {{accounts}} here. You stay signed in as {{keep}}, and the others stay saved so you can switch to them.',
              }),
            }}
            onClick={() => dispatch.auth.setSeveral(!several)}
          />
        )}
        <ListItemSetting
          confirm={backendAuthenticated}
          label={t('nav.signOut', 'Sign out')}
          icon="sign-out"
          onClick={async () => {
            await dispatch.auth.signOut()
            history.replace('/sign-in')
          }}
          confirmProps={{
            children: t(
              'nav.signOutConfirm',
              'Signing out will allow this device to be transferred or another user to sign in. It will stop all connections.'
            ),
          }}
        />
        {remoteUI || (
          <DesktopUI>
            <ListItemSetting
              confirm
              label={t('nav.quit', 'Quit')}
              icon="power-off"
              onClick={() => emit('user/quit')}
              confirmProps={{
                title: t('common.areYouSure', 'Are you sure?'),
                children: t('nav.quitConfirm', 'Quitting will not close your connections.'),
              }}
            />
          </DesktopUI>
        )}
      </Menu>
    </>
  )
}

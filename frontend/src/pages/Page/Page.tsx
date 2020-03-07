import React from 'react'
import { isElectron } from '../../services/Browser'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, IconButton } from '@material-ui/core'
import { spacing, colors } from '../../styling'
import { UpdateNotice } from '../../components/UpdateNotice'
import { RemoteHeader } from '../../components/RemoteHeader'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { backend } = useDispatch<Dispatch>()
  const { connected, cliError, authenticated, user, os } = useSelector((state: ApplicationState) => ({
    connected: state.ui.connected,
    cliError: state.backend.cliError,
    os: state.backend.os,
    authenticated: state.auth.authenticated,
    user: state.auth.user,
  }))
  const css = useStyles()
  const clearCliError = () => backend.set({ key: 'cliError', value: undefined })
  let message = ''
  let remoteCss = ''
  let pageCss = css.page + ' ' + css.full

  if (!isElectron()) {
    pageCss += ' ' + css.inset
    remoteCss = css.full + ' ' + css.default
    remoteCss += os ? ' ' + css[os] : ''
  }

  if (user && !authenticated) message = 'Authenticating...'
  else if (authenticated && !connected) message = 'Webserver connection lost. Retrying...'

  return (
    <div className={remoteCss}>
      <RemoteHeader os={os} />
      <div className={pageCss}>
        {children}
        <Snackbar open={!!message} message={message} />
        <Snackbar
          className={css.error}
          key={cliError}
          open={!!cliError}
          message={
            <>
              <Icon name="exclamation-triangle" size="md" color="danger" fixedWidth inlineLeft />
              {cliError}
            </>
          }
          action={
            <IconButton onClick={clearCliError}>
              <Icon name="times" size="md" color="white" fixedWidth />
            </IconButton>
          }
          onClose={clearCliError}
        />
        <UpdateNotice />
      </div>
    </div>
  )
}

const useStyles = makeStyles({
  full: { top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' },
  page: {
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    backgroundColor: colors.white,
    maxWidth: 1000,
    margin: 'auto',
  },
  error: {
    // '& .MuiPaper-root': { backgroundColor: colors.danger },
  },
  inset: {
    top: spacing.xl,
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    borderRadius: spacing.sm,
  },
  default: { backgroundColor: colors.grayDarker, padding: spacing.xs },
  mac: { backgroundColor: colors.grayDark },
  rpi: { backgroundColor: colors.rpi },
  linux: { backgroundColor: colors.success },
  windows: { backgroundColor: colors.primary },
})

import React from 'react'
import Controller from '../../services/Controller'
import classnames from 'classnames'
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
  const { connected, cliError, authenticated, os, oobAvailable } = useSelector((state: ApplicationState) => ({
    connected: state.ui.connected,
    cliError: state.backend.cliError,
    os: state.backend.environment.os,
    authenticated: state.auth.authenticated,
    oobAvailable: state.backend.environment.oobAvailable,
  }))

  const css = useStyles()
  const clearCliError = () => backend.set({ key: 'cliError', value: undefined })
  const reconnect = () => Controller.open(false, true)

  let remoteCss = ''
  let pageCss = classnames(css.page, css.full)

  if (!isElectron()) {
    pageCss = classnames(pageCss, css.inset)
    remoteCss = classnames(css.full, css.default, os && css[os])
  }

  return (
    <div className={remoteCss}>
      <RemoteHeader os={os} />
      <div className={pageCss}>
        {children}
        <Snackbar
          open={authenticated && !connected}
          message="Webserver connection lost. Retrying..."
          action={
            <IconButton onClick={reconnect}>
              <Icon name="sync" size="md" color="white" fixedWidth />
            </IconButton>
          }
        />
        <Snackbar
          className={css.error}
          key={cliError}
          open={!!cliError}
          message={
            <>
              <Icon name="exclamation-triangle" size="md" color="danger" weight="regular" fixedWidth inlineLeft />
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

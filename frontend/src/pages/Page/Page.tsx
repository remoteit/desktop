import React from 'react'
import Controller from '../../services/Controller'
import classnames from 'classnames'
import { isElectron } from '../../services/Browser'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, IconButton, makeStyles, useMediaQuery } from '@material-ui/core'
import { spacing, colors } from '../../styling'
import { UpdateNotice } from '../../components/UpdateNotice'
import { RemoteHeader } from '../../components/RemoteHeader'
import { Sidebar } from '../../components/Sidebar'
import { Icon } from '../../components/Icon'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { backend, ui } = useDispatch<Dispatch>()
  const { connected, successMessage, globalError, backendAuthenticated, os } = useSelector((state: ApplicationState) => ({
    connected: state.ui.connected,
    successMessage: state.ui.successMessage,
    globalError: state.backend.globalError,
    backendAuthenticated: state.auth.backendAuthenticated,
    os: state.backend.environment.os,
  }))

  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles()
  const clearSuccessMessage = () => ui.set({ successMessage: undefined })
  const clearCliError = () => backend.set({ globalError: undefined })
  const reconnect = () => Controller.open(false, true)

  let remoteCss = ''
  let pageCss = classnames(css.page, css.full)

  if (!isElectron() && largeScreen) {
    pageCss = classnames(pageCss, css.inset)
    remoteCss = classnames(css.full, css.default)
  }

  return (
    <div className={remoteCss}>
      <RemoteHeader os={os} />
      <div className={pageCss}>
        {largeScreen && <Sidebar />}
        <div className={css.pageBody}>{children}</div>
        <Snackbar
          open={backendAuthenticated && !connected}
          message="Webserver connection lost. Retrying..."
          action={
            <IconButton onClick={reconnect}>
              <Icon name="sync" size="md" color="white" fixedWidth />
            </IconButton>
          }
        />
        <Snackbar
          key={globalError}
          open={!!globalError}
          message={
            <>
              <Icon name="exclamation-triangle" size="md" color="danger" type="regular" fixedWidth inlineLeft />
              {globalError}
            </>
          }
          action={
            <IconButton onClick={clearCliError}>
              <Icon name="times" size="md" color="white" fixedWidth />
            </IconButton>
          }
          onClose={clearCliError}
        />
        <Snackbar
          key={successMessage}
          open={!!successMessage}
          message={
            <>
              <Icon name="check" size="md" color="success" type="regular" fixedWidth inlineLeft />
              {successMessage}
            </>
          }
          action={
            <IconButton onClick={clearSuccessMessage}>
              <Icon name="times" size="md" color="white" fixedWidth />
            </IconButton>
          }
          onClose={clearSuccessMessage}
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
    flexFlow: 'row',
    backgroundColor: colors.white,
    maxWidth: 1000,
    margin: 'auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  },
  pageBody: {
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    flexWrap: 'nowrap',
    flexGrow: 1,
  },
  inset: {
    top: spacing.xl,
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: spacing.sm,
  },
  default: { backgroundColor: colors.gray, padding: spacing.xs },
})

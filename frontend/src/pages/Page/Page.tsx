import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { isElectron, os } from '../../services/Platform'
import { Snackbar, IconButton } from '@material-ui/core'
import { spacing, colors } from '../../styling'
import { UpdateNotice } from '../../components/UpdateNotice'
import { RemoteHeader } from '../../components/RemoteHeader'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'

export interface Props {
  children: React.ReactNode
  authenticated?: boolean
}

export function Page({ authenticated = true, children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { backend } = useDispatch<Dispatch>()
  const { connected, cliError } = useSelector((state: ApplicationState) => ({
    connected: state.ui.connected,
    cliError: state.backend.cliError,
  }))
  const css = useStyles()
  const clearCliError = () => backend.set({ key: 'cliError', value: undefined })
  let remoteCss = ''
  let pageCss = css.page + ' ' + css.full

  if (!isElectron()) {
    pageCss += ' ' + css.inset
    remoteCss = css[os()]
    remoteCss += ' ' + css.full
  }

  return (
    <div className={remoteCss}>
      <RemoteHeader />
      <div className={pageCss}>
        {children}
        <Snackbar open={authenticated && !connected} message="Webserver connection lost. Retrying..." />
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
  page: {
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    backgroundColor: colors.white,
  },
  error: {
    // '& .MuiPaper-root': { backgroundColor: colors.danger },
  },
  full: { top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' },
  inset: { top: spacing.xl, left: spacing.xs, right: spacing.xs, bottom: spacing.xs, borderRadius: spacing.sm },
  mac: { backgroundColor: colors.grayDark, padding: spacing.xs },
  linux: { backgroundColor: colors.success, padding: spacing.xs },
  windows: { backgroundColor: colors.primary, padding: spacing.xs },
})

import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, IconButton } from '@material-ui/core'
import { UpdateNotice } from '../../components/UpdateNotice'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

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

  return (
    <div className={css.page}>
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
  )
}

const useStyles = makeStyles({
  page: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    backgroundColor: styles.colors.white,
  },
  error: {
    // '& .MuiPaper-root': { backgroundColor: styles.colors.danger },
  },
})

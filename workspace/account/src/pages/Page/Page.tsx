import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Snackbar, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const {
    successMessage,
    noticeMessage,
    errorMessage,
    offline,
  } = useSelector((state: ApplicationState) => {
    return {
      connected: state.ui.connected,
      successMessage: state.ui.successMessage,
      noticeMessage: state.ui.noticeMessage,
      errorMessage: state.ui.errorMessage,
      offline: state.ui.offline,
      backendAuthenticated: state.auth.backendAuthenticated,
    }
  })

  let snackbar = ''
  if (noticeMessage) snackbar = 'notice'
  if (successMessage) snackbar = 'success'
  if (errorMessage) snackbar = 'error'
  if (offline) snackbar = 'offline'

  return (
    <>
      {children}
      <Snackbar
        open={snackbar === 'offline'}
        message={
          <>
            <Icon name="exclamation-triangle" size="md" color="warning" type="regular" fixedWidth inlineLeft />
            Network offline.
          </>
        }
      />
      <Snackbar
        open={snackbar === 'retry'}
        message="Webserver connection lost. Retrying..."
        action={
          <IconButton>
            <Icon name="sync" size="md" color="white" fixedWidth />
          </IconButton>
        }
      />
      <Snackbar
        key={errorMessage || 'error'}
        open={snackbar === 'error'}
        message={
          <>
            <Icon name="exclamation-triangle" size="md" color="danger" type="regular" fixedWidth inlineLeft />
            {errorMessage}
          </>
        }
        action={
          <IconButton>
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
      />
      <Snackbar
        key={noticeMessage || 'notice'}
        open={snackbar === 'notice'}
        message={noticeMessage}
        autoHideDuration={20000}
      />
      <Snackbar
        key={successMessage || 'success'}
        open={snackbar === 'success'}
        message={
          <>
            <Icon name="check" size="md" color="success" type="regular" fixedWidth inlineLeft />
            {successMessage}
          </>
        }
        action={
          <IconButton>
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
      />
    </>
  )
}

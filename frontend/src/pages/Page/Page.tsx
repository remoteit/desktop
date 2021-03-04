import React from 'react'
import Controller from '../../services/Controller'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, IconButton } from '@material-ui/core'
import { UpdateNotice } from '../../components/UpdateNotice'
import { RemoteHeader } from '../../components/RemoteHeader'
import { getOwnDevices } from '../../models/accounts'
import { Icon } from '../../components/Icon'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { ui } = useDispatch<Dispatch>()
  const { connected, successMessage, noticeMessage, errorMessage, backendAuthenticated, os, label } = useSelector(
    (state: ApplicationState) => {
      const device = getOwnDevices(state).find(d => d.id === state.backend.device.uid)
      return {
        connected: state.ui.connected,
        successMessage: state.ui.successMessage,
        noticeMessage: state.ui.noticeMessage,
        errorMessage: state.ui.errorMessage,
        backendAuthenticated: state.auth.backendAuthenticated,
        os: state.backend.environment.os,
        label: state.labels.find(l => l.id === device?.attributes.color),
      }
    }
  )

  const clearSuccessMessage = () => ui.set({ successMessage: undefined })
  const clearErrorMessage = () => ui.set({ errorMessage: undefined })
  const reconnect = () => Controller.open(false, true)

  // only show one message at a time
  let snackbar = ''
  if (noticeMessage) snackbar = 'notice'
  if (successMessage) snackbar = 'success'
  if (errorMessage) snackbar = 'error'
  if (backendAuthenticated && !connected) snackbar = 'offline'

  return (
    <RemoteHeader os={os} color={label?.id ? label.color : undefined}>
      {children}
      <Snackbar
        open={snackbar === 'offline'}
        message="Webserver connection lost. Retrying..."
        action={
          <IconButton onClick={reconnect}>
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
          <IconButton onClick={clearErrorMessage}>
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
        onClose={clearErrorMessage}
      />
      <Snackbar
        key={noticeMessage || 'notice'}
        open={snackbar === 'notice'}
        message={noticeMessage}
        onClose={() => ui.set({ noticeMessage: '' })}
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
          <IconButton onClick={clearSuccessMessage}>
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
        onClose={clearSuccessMessage}
      />
      <UpdateNotice />
    </RemoteHeader>
  )
}

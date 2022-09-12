import React from 'react'
import { isPortal } from '../services/Browser'
import { useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Snackbar, Button } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

export const ConnectionNotice: React.FC<{ className: string }> = ({ className }) => {
  const { queueCount, queueEnabling, queueFinished, queueConnection } = useSelector(
    (state: ApplicationState) => state.connections
  )
  const { connections } = useDispatch<Dispatch>()
  const history = useHistory()

  const clearConnectionsMessage = () => connections.set({ queueCount: 0, queueFinished: false })

  const stopped = isPortal() ? 'disconnected' : 'stopped'
  const started = isPortal() ? 'connected' : 'started'
  let message = `${queueCount} connection${queueCount === 1 ? '' : 's'}`
  message += queueEnabling ? ` ${started}.` : ` ${stopped}.`

  return (
    <Snackbar
      className={className}
      key="connection"
      open={queueFinished && !!queueCount}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      autoHideDuration={20000}
      message={
        <>
          <Icon name="check" size="md" color="success" type="regular" fixedWidth inlineLeft />
          {message}
        </>
      }
      action={
        <>
          {queueEnabling && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                console.log(`/devices/${queueConnection?.deviceID}/${queueConnection?.id}`)
                history.push(`/devices/${queueConnection?.deviceID}/${queueConnection?.id}`)
              }}
            >
              <Icon name="arrow-right-arrow-left" size="md" color="white" inlineLeft /> Get Endpoint
              {queueCount === 1 ? '' : 's'}
            </Button>
          )}
          <IconButton onClick={clearConnectionsMessage} icon="times" size="md" color="white" />
        </>
      }
      onClose={clearConnectionsMessage}
    />
  )
}

import React from 'react'
import browser from '../services/Browser'
import { useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { Snackbar, Button } from '@mui/material'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const ConnectionNotice: React.FC<{ className: string }> = ({ className }) => {
  const { queueCount, queueEnabling, queueFinished, queueConnection } = useSelector((state: State) => state.connections)
  const { connections } = useDispatch<Dispatch>()
  const history = useHistory()

  const clearConnectionsMessage = () => connections.set({ queueCount: 0, queueFinished: false })

  const stopped = browser.hasBackend ? 'stopped' : 'disconnected'
  const started = browser.hasBackend ? 'started' : 'connected'
  let message = `${queueCount} connection${queueCount === 1 ? '' : 's'}`
  message += queueEnabling ? ` ${started}.` : ` ${stopped}.`

  return (
    <Snackbar
      key="connection"
      className={className}
      open={queueFinished && !!queueCount}
      onClose={clearConnectionsMessage}
      autoHideDuration={20000}
      message={
        <Notice
          severity="success"
          fullWidth
          button={
            queueEnabling && (
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  console.log(`/devices/${queueConnection?.deviceID}/${queueConnection?.id}`)
                  history.push(`/devices/${queueConnection?.deviceID}/${queueConnection?.id}`)
                }}
              >
                <Icon name="arrow-right-arrow-left" size="md" color="alwaysWhite" inlineLeft /> Show Endpoint
                {queueCount === 1 ? '' : 's'}
              </Button>
            )
          }
          onClose={clearConnectionsMessage}
          invert
        >
          {message}
        </Notice>
      }
    />
  )
}

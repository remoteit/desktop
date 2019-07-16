import React from 'react'
import { connect } from 'react-redux'
import { IconButton } from '@material-ui/core'
import { Icon } from '../Icon'

export type ConnectionErrorMessageProps = {
  connection: ConnectionInfo
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  clearConnectionError: dispatch.devices.clearConnectionError,
})

export const ConnectionErrorMessage = connect(
  null,
  mapDispatch
)(({ clearConnectionError, connection }: ConnectionErrorMessageProps) => {
  if (!connection.error) return null

  // Don't show an error if the process was killed by the user.
  if (connection.error.code === 3) return null

  return (
    <div className="df ai-center bg-danger txt-sm white px-md py-sm">
      <div className="pr-md">
        <h4 className="txt-sm mt-none mb-xs white">
          Connection Error
          {connection.error.code && (
            <span className="ml-md">(CODE: {connection.error.code})</span>
          )}
        </h4>
        {!connection.error.code && (
          <div className="mb-sm">
            Failed to connect for an unknown reason. Perhaps the process was
            killed outside of remote.it desktop?
          </div>
        )}
        <div>
          <code>{connection.error.message}</code>
        </div>
      </div>
      <div className="ml-auto">
        <IconButton onClick={() => clearConnectionError(connection.id)}>
          <Icon name="times" color="white" size="sm" />
        </IconButton>
      </div>
    </div>
  )
})

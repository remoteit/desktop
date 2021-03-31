import React from 'react'
import { emit } from '../../services/Controller'
import { useLocation } from 'react-router-dom'
import { Tooltip, IconButton, Button } from '@material-ui/core'
import { connectionState } from '../../helpers/connectionHelper'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
  all?: boolean
}

export const ClearButton: React.FC<Props> = ({ disabled = false, connection, all }) => {
  const state = connectionState(undefined, connection)
  const location = useLocation()
  if (!all && (!connection || state === 'connected' || !connection.createdTime)) return null
  if (!location.pathname.includes('connections')) return null

  const forget = () => {
    emit(all ? 'service/clear-recent' : 'service/clear', connection)
  }

  return all ? (
    <Button disabled={disabled} onClick={forget} size="small">
      Clear all
    </Button>
  ) : (
    <Tooltip title="Clear this connection">
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

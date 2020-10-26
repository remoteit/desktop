import React from 'react'
import { emit } from '../../services/Controller'
import { Tooltip, IconButton, Button } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
  all?: boolean
}

export const ClearButton: React.FC<Props> = ({ disabled = false, connection, all }) => {
  if (!all && (!connection || connection.active || !connection.startTime)) return null

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

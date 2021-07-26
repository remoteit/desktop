import React from 'react'
import { emit } from '../../services/Controller'
import { Tooltip, IconButton, Button } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
  all?: boolean
}

export const ClearButton: React.FC<Props> = ({ disabled, connection, all }) => {
  if (!all && (!connection || connection.enabled || !connection.createdTime)) return null

  const forget = () => {
    // @TODO add confirm to clear all
    emit(all ? 'service/clear-recent' : 'service/clear', connection)
  }

  return all ? (
    <Button disabled={disabled} onClick={forget} size="small">
      Clear all
    </Button>
  ) : (
    <Tooltip title="Remove from recent">
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

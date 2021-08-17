import React from 'react'
import { emit } from '../../services/Controller'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  disabled?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection }) => {
  const history = useHistory()

  if (connection?.createdTime || connection?.enabled) return null

  const forget = () => {
    emit('service/forget', connection)
    history.push('/connections')
  }

  return (
    <Tooltip title="Clear all settings">
      <IconButton disabled={disabled} onClick={forget}>
        <Icon name="trash" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

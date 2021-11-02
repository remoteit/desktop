import React from 'react'
import { emit } from '../../services/Controller'
import { useHistory } from 'react-router-dom'
import { IconButton } from '../IconButton'

type Props = {
  connection?: IConnection
  disabled?: boolean
  inline?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection, inline }) => {
  const history = useHistory()

  if (connection?.createdTime || connection?.enabled) return null

  const forget = () => {
    emit('service/forget', connection)
    history.push('/connections')
  }

  return (
    <IconButton
      title="Clear all settings"
      disabled={disabled}
      onClick={forget}
      icon="trash"
      size="md"
      inline={inline}
      fixedWidth
    />
  )
}

import React from 'react'
import { emit } from '../../services/Controller'
import { IconButton } from '../IconButton'

type Props = {
  connection?: IConnection
  disabled?: boolean
  inline?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection, inline }) => {
  if (connection?.createdTime || connection?.enabled) return null

  const forget = () => {
    // @TODO fixme this needs to be a local clear unless in desktop ui
    emit('service/forget', connection)
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

import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { IconButton } from '../IconButton'

type Props = {
  connection?: IConnection
  disabled?: boolean
  inline?: boolean
}

export const ForgetButton: React.FC<Props> = ({ disabled = false, connection, inline }) => {
  const dispatch = useDispatch<Dispatch>()
  if (!connection || connection.enabled || connection.default) return null

  const forget = () => {
    dispatch.connections.forget(connection.id)
  }

  return (
    <IconButton
      title="Reset connect settings"
      disabled={disabled}
      onClick={forget}
      icon="undo"
      size="md"
      inline={inline}
      fixedWidth
    />
  )
}

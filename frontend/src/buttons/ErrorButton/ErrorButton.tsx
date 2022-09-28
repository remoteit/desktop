import React from 'react'
import { IconButton } from '../IconButton'

type Props = { connection?: IConnection; onClick?: () => void; visible: boolean }

export const ErrorButton: React.FC<Props> = ({ connection, onClick, visible }) => {
  if (!connection || !connection.error?.message) return null

  return (
    <IconButton
      onClick={event => {
        event.stopPropagation()
        onClick && onClick()
      }}
      title={visible ? 'Hide error' : 'Show error'}
      icon="exclamation-triangle"
      size="md"
      color="danger"
      inlineLeft
    />
  )
}

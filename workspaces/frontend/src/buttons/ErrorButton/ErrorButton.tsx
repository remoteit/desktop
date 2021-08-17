import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = { connection?: IConnection; onClick?: () => void; visible: boolean; className?: string }

export const ErrorButton: React.FC<Props> = ({ connection, onClick, visible, className }) => {
  if (!connection || !connection.error?.message) return null

  return (
    <Tooltip title={visible ? 'Hide error' : 'Show error'} className={className}>
      <IconButton
        onClick={event => {
          event.stopPropagation()
          onClick && onClick()
        }}
      >
        <Icon name="exclamation-triangle" color="danger" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

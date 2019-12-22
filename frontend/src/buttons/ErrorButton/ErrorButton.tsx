import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { spacing } from '../../styling'

type Props = { connection?: IConnection; onClick?: () => void; visible: boolean }

export const ErrorButton: React.FC<Props> = ({ connection, onClick, visible }) => {
  if (!connection || !connection.error) return null

  return (
    <Tooltip title={visible ? 'Hide error' : 'Show error'}>
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="exclamation-triangle" color="warning" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

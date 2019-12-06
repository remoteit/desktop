import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { useClipboard } from 'use-clipboard-copy'
import { hostName } from '../../helpers/nameHelper'
import { Icon } from '../../components/Icon'

export interface CopyButtonProps {
  connection?: IConnection
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!connection || !connection.active) return null

  let title = 'Copy launch URL'
  let value = hostName(connection)

  return (
    <span {...props}>
      <Tooltip title={title}>
        <IconButton onClick={clipboard.copy}>
          <Icon name="clipboard" color={clipboard.copied ? 'success' : undefined} size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <input type="hidden" style={{ display: 'none' }} ref={clipboard.target} value={value} />
    </span>
  )
}

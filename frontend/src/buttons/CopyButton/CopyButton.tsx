import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { useApplication } from '../../shared/applications'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from '../../components/Icon'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, service, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(service && service.typeID)

  if (!connection || !connection.active || !app) return null

  return (
    <span {...props}>
      <Tooltip title={clipboard.copied ? 'Copied!' : `Copy ${app.title}`}>
        <IconButton onClick={clipboard.copy}>
          <Icon name="clipboard" color={clipboard.copied ? 'success' : undefined} size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <input type="hidden" style={{ display: 'none' }} ref={clipboard.target} value={app.copy(connection)} />
    </span>
  )
}

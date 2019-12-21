import React from 'react'
import { IService } from 'remote.it'
import { IconButton, Tooltip } from '@material-ui/core'
import { useApplication } from '../../services/applications'
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
      <Tooltip title={`Copy ${app.title} string`}>
        <IconButton onClick={clipboard.copy}>
          <Icon name="clipboard" color={clipboard.copied ? 'success' : undefined} size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <input type="hidden" style={{ display: 'none' }} ref={clipboard.target} value={app.copy(connection)} />
    </span>
  )
}

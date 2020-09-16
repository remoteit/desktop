import React from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { useApplication } from '../../shared/applications'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from '../../components/Icon'
import { FontSize } from '../../styling'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, service, menuItem, size = 'md' }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(service && service.typeID)

  if (!connection || !connection.active || !app) return null

  const CopyIcon = (
    <>
      <Icon
        name={clipboard.copied ? 'check' : 'clipboard'}
        color={clipboard.copied ? 'success' : undefined}
        size={size}
        fixedWidth
      />
      <input type="hidden" ref={clipboard.target} value={app.copy(connection)} />
    </>
  )

  return menuItem ? (
    <MenuItem dense onClick={clipboard.copy}>
      <ListItemIcon>{CopyIcon}</ListItemIcon>
      <ListItemText primary={clipboard.copied ? 'Copied!' : 'Copy connection'} />
    </MenuItem>
  ) : (
    <Tooltip title={clipboard.copied ? 'Copied!' : 'Copy connection'}>
      <IconButton onClick={clipboard.copy}>{CopyIcon}</IconButton>
    </Tooltip>
  )
}

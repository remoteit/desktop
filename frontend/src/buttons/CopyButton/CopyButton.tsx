import React, { useState } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { useApplication } from '../../shared/applications'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from '../../components/Icon'
import { FontSize } from '../../styling'
import { setConnection } from '../../helpers/connectionHelper'
import { UsernameModal } from '../../components/UsernameModal'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, service, menuItem, size = 'md' }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(service && service.typeID)

  const [open, setOpen] = useState<boolean>(false)
  if (!connection || !connection.active || !app) return null

  const check = () => {
    app.prompt && !connection.username ? setOpen(true) : clipboard.copy()
  }
  const onClose = () => {
    setOpen(false)
  }

  const onSubmit = (username: string) => {
    if (username) {
      setConnection({ ...connection, username: username.toString() })
      setTimeout(function () {
        clipboard.copy()
        onClose()
      }, 500)
    }
  }

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
  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={check}>
          <ListItemIcon>{CopyIcon}</ListItemIcon>
          <ListItemText primary={clipboard.copied ? 'Copied!' : 'Copy connection'} />
        </MenuItem>
      ) : (
        <Tooltip title={clipboard.copied ? 'Copied!' : 'Copy connection'}>
          <IconButton onClick={check}>{CopyIcon}</IconButton>
        </Tooltip>
      )}

      <UsernameModal connection={connection} open={open} onSubmit={onSubmit} service={service} onClose={onClose} />
    </>
  )
}

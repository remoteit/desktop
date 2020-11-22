import React, { useState } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { useApplicationService } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
import { useClipboard } from 'use-clipboard-copy'
import { PromptModal } from '../../components/PromptModal'
import { FontSize } from '../../styling'
import { Icon } from '../../components/Icon'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const CopyButton: React.FC<CopyButtonProps> = ({ connection, service, menuItem, size = 'md' }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplicationService('copy', service, connection)

  const [open, setOpen] = useState<boolean>(false)
  if (!connection || !connection.active || !app) return null

  const check = () => {
    app.prompt ? setOpen(true) : clipboard.copy()
  }
  const onClose = () => {
    setOpen(false)
  }

  const onSubmit = (tokens: ILookup<string>) => {
    if (tokens.length) {
      setConnection({ ...connection, ...tokens })
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
      <input type="hidden" ref={clipboard.target} value={app.command} />
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

      <PromptModal app={app} open={open} onClose={onClose} onSubmit={onSubmit} />
    </>
  )
}

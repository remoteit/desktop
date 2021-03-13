import React, { useState } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { setConnection } from '../helpers/connectionHelper'
import { useApplication } from '../hooks/useApplication'
import { useClipboard } from 'use-clipboard-copy'
import { PromptModal } from '../components/PromptModal'
import { Application } from '../shared/applications'
import { FontSize, Color } from '../styling'
import { Icon } from '../components/Icon'

export interface CopyButtonProps {
  connection?: IConnection
  service?: IService
  context?: Application['context']
  color?: Color
  title?: string
  menuItem?: boolean
  size?: FontSize
  show?: boolean
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  connection,
  service,
  menuItem,
  color,
  context = 'copy',
  title = 'Copy',
  size = 'md',
  show,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(context, service, connection)

  if (!connection || (!show && (!connection?.enabled || !app))) return null

  const check = event => {
    event.preventDefault()
    event.stopPropagation()
    app.prompt ? setOpen(true) : clipboard.copy()
  }
  const onClose = () => {
    setOpen(false)
  }

  const onSubmit = (tokens: ILookup<string>) => {
    setConnection({ ...connection, ...tokens })
    setTimeout(() => {
      clipboard.copy()
      onClose()
    }, 500)
  }

  const CopyIcon = (
    <>
      <Icon
        name={clipboard.copied ? 'check' : 'copy'}
        color={clipboard.copied ? 'success' : color}
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
          <ListItemText primary={clipboard.copied ? 'Copied!' : title} />
        </MenuItem>
      ) : (
        <Tooltip title={clipboard.copied ? 'Copied!' : title}>
          <IconButton onClick={check} onMouseEnter={event => event.stopPropagation()}>
            {CopyIcon}
          </IconButton>
        </Tooltip>
      )}

      <PromptModal app={app} open={open} onClose={onClose} onSubmit={onSubmit} />
    </>
  )
}

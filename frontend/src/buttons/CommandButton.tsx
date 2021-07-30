import React, { useState } from 'react'
import { IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { FontSize, Color } from '../styling'
import { setConnection } from '../helpers/connectionHelper'
import { useApplication } from '../hooks/useApplication'
import { useClipboard } from 'use-clipboard-copy'
import { PromptModal } from '../components/PromptModal'
import { Application } from '../shared/applications'
import { DataButton } from './DataButton'
import { Icon } from '../components/Icon'

export interface CommandButtonProps {
  connection?: IConnection
  service?: IService
  context?: Application['context']
  color?: Color
  title?: string
  menuItem?: boolean
  size?: FontSize
  type?: IconType
  show?: boolean
  dataButton?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onCopy?: () => void
}

export const CommandButton: React.FC<CommandButtonProps> = ({
  connection,
  service,
  menuItem,
  color,
  context = 'copy',
  title = 'Command',
  size = 'md',
  type,
  show,
  dataButton,
  onMouseEnter,
  onMouseLeave,
  onCopy,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(context, service, connection)

  if (!connection || (!show && (!connection?.enabled || !app))) return null

  const check = () => (app.prompt ? setOpen(true) : copy())
  const copy = () => {
    clipboard.copy()
    setTimeout(() => {
      onCopy && onCopy()
      setOpen(false)
    }, 600)
  }

  const onSubmit = (tokens: ILookup<string>) => {
    setConnection({ ...connection, ...tokens })
    setTimeout(copy, 100)
  }

  const CopyIcon = (
    <>
      <Icon
        name={clipboard.copied ? 'check' : app.icon}
        color={clipboard.copied ? color || 'success' : color}
        size={size}
        type={type}
        fixedWidth
      />
      <input type="hidden" ref={clipboard.target} value={app.command} />
    </>
  )

  title = clipboard.copied ? 'Copied!' : title

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={check}>
          <ListItemIcon>{CopyIcon}</ListItemIcon>
          <ListItemText primary={title} />
        </MenuItem>
      ) : dataButton ? (
        <DataButton label="Command" value={app.command} title={title} icon={CopyIcon} onClick={check} />
      ) : (
        <Tooltip title={title}>
          <IconButton onClick={check} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {CopyIcon}
          </IconButton>
        </Tooltip>
      )}
      <PromptModal app={app} open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </>
  )
}

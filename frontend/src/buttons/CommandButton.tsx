import React, { useState } from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { FontSize, Color } from '../styling'
import { setConnection } from '../helpers/connectionHelper'
import { useApplication } from '../hooks/useApplication'
import { useClipboard } from 'use-clipboard-copy'
import { PromptModal } from '../components/PromptModal'
import { IconButton } from '../buttons/IconButton'
import { DataButton } from './DataButton'
import { Icon } from '../components/Icon'

export interface CommandButtonProps {
  connection?: IConnection
  service?: IService
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
  title,
  size = 'md',
  show,
  dataButton,
  onCopy,
  ...props
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  const app = useApplication(service, connection)

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
    <Icon
      name={clipboard.copied ? 'check' : 'copy'}
      color={clipboard.copied ? props.color || 'success' : props.color}
      size={size}
      type={props.type}
      fixedWidth
    />
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
        <DataButton label="Command" value={app.string} title={title || 'Command'} icon={CopyIcon} onClick={check} />
      ) : (
        <IconButton {...props} onClick={check} size={size} icon={clipboard.copied ? 'check' : 'copy'} />
      )}
      <input type="hidden" ref={clipboard.target} value={app.string} />
      <PromptModal app={app} open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
    </>
  )
}

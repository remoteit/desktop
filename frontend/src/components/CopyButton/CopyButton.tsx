import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'
import { useClipboard } from 'use-clipboard-copy'
import { FontSize, Color } from '../../styling'

export interface CopyButtonProps {
  connection?: IConnection
  color?: Color
  size?: FontSize
  text?: string
  title?: string
  [key: string]: any
}

export function CopyButton({ connection, color, size = 'md', text, title = 'Copy', ...props }: CopyButtonProps) {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  if (connection) {
    title = 'Copy launch URL'
    text = connection.port ? `localhost:${connection.port}` : text
  }
  if (!text) return null
  return (
    <span {...props}>
      <Tooltip title={title}>
        <IconButton onClick={clipboard.copy}>
          <Icon name="clipboard" color={clipboard.copied ? 'success' : color} size={size} fixedWidth />
        </IconButton>
      </Tooltip>
      <input type="hidden" className="dn" ref={clipboard.target} value={text} />
    </span>
  )
}

import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'
import { useClipboard } from 'use-clipboard-copy'
import { FontSize } from '../../styling'

export interface CopyButtonProps {
  color?: BrandColors
  size?: FontSize
  text: string
  title?: string
  show?: boolean
  [key: string]: any
}

export function CopyButton({
  color = 'gray',
  size = 'md',
  text,
  title = 'Copy',
  show = true,
  ...props
}: CopyButtonProps) {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  if (!show) return null
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

import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'
import { useClipboard } from 'use-clipboard-copy'

export interface CopyButtonProps {
  size?: FontSizes
  text: string
  title?: string
}

export function CopyButton({
  size = 'md',
  text,
  title = 'Copy',
}: CopyButtonProps) {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <>
      <Tooltip title={title}>
        <IconButton onClick={clipboard.copy}>
          <Icon
            name="copy"
            color={clipboard.copied ? 'success' : 'gray-dark'}
            size={size}
            fixedWidth
          />
        </IconButton>
      </Tooltip>
      <input type="hidden" className="dn" ref={clipboard.target} value={text} />
    </>
  )
}

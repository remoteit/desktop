import React from 'react'
import { TextField, IconButton } from '@material-ui/core'
import { useClipboard } from 'use-clipboard-copy'
import { Icon } from '../Icon'

export interface CopyableTextProps {
  value: string
}

export function CopyableText({
  value,
  ...props
}: CopyableTextProps & React.HTMLProps<HTMLDivElement>) {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <div {...props}>
      <TextField
        type="text"
        value={value}
        onFocus={e => e.target.select()}
        inputRef={clipboard.target}
        InputProps={{ className: 'gray-dark', readOnly: true }}
      />
      <IconButton className="ml-xs" onClick={clipboard.copy}>
        <Icon
          name={clipboard.copied ? 'clipboard-check' : 'clipboard'}
          color={clipboard.copied ? 'success' : 'gray-dark'}
          fixedWidth
        />
      </IconButton>
    </div>
  )
}

import React from 'react'
import { TextField } from '@material-ui/core'
import { CopyButton } from '../CopyButton'

export interface CopyableTextProps {
  value: string
}

export function CopyableText({
  value,
  ...props
}: CopyableTextProps & React.HTMLProps<HTMLDivElement>) {
  return (
    <div {...props}>
      <TextField
        type="text"
        value={value}
        onFocus={e => e.target.select()}
        InputProps={{ className: 'gray-dark', readOnly: true }}
      />
      <CopyButton text={value} />
    </div>
  )
}

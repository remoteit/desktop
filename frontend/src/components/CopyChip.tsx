import React from 'react'
import { Chip, ChipProps } from '@mui/material'
import { useClipboard } from 'use-clipboard-copy'

type Props = ChipProps & {
  title: string
  value?: string
}

export const CopyChip: React.FC<Props> = ({ value, title, size = 'small', ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  if (!value) return null
  return (
    <>
      <Chip
        {...props}
        size={size}
        onClick={clipboard.copy}
        color={clipboard.copied ? 'success' : props.color}
        label={clipboard.copied ? 'Copied!' : title}
      />
      <input type="hidden" ref={clipboard.target} value={value} />
    </>
  )
}

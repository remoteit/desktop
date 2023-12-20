import React from 'react'
import useClipboard from '../hooks/useClipboard'
import { Chip, ChipProps } from '@mui/material'

type Props = ChipProps & {
  title: string
  value?: string
}

export const CopyChip: React.FC<Props> = ({ value, title, size = 'small', ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  if (!value) return null
  return (
    <Chip
      {...props}
      size={size}
      onClick={() => clipboard.copy(value)}
      color={clipboard.copied ? 'success' : props.color}
      label={clipboard.copied ? 'Copied!' : title}
    />
  )
}

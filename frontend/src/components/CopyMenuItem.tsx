import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'

interface Props {
  icon: string
  title: string
  value: string | number
  disabled?: boolean
}

export const CopyMenuItem: React.FC<Props> = ({ icon, value, title, disabled }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <>
      <MenuItem dense onClick={clipboard.copy} disabled={disabled}>
        <ListItemIcon>
          <Icon name={clipboard.copied ? 'check' : icon} color={clipboard.copied ? 'success' : undefined} size="md" />
        </ListItemIcon>
        <ListItemText primary={clipboard.copied ? 'Copied!' : title} />
        <input type="hidden" ref={clipboard.target} value={value} />
      </MenuItem>
    </>
  )
}

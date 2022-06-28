import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'

export interface CopyButtonProps {
  icon: string
  title: string
  value: string | number
}

export const CopyMenuItem: React.FC<CopyButtonProps> = ({ icon, value, title }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <>
      <MenuItem dense disableGutters onClick={clipboard.copy}>
        <ListItemIcon>
          <Icon name={clipboard.copied ? 'check' : icon} color={clipboard.copied ? 'success' : undefined} size="md" />
        </ListItemIcon>
        <ListItemText primary={clipboard.copied ? 'Copied!' : title} />
        <input type="hidden" ref={clipboard.target} value={value} />
      </MenuItem>
    </>
  )
}

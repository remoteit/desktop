import React from 'react'
import { PROTOCOL } from '../shared/constants'
import { useClipboard } from 'use-clipboard-copy'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { Icon } from './Icon'

export interface CopyButtonProps {
  icon: string
  title: string
  value: string | number
}

export const CopyMenuItem: React.FC<CopyButtonProps> = ({ icon, value, title }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  title = clipboard.copied ? 'Copied!' : title

  return (
    <>
      <MenuItem dense disableGutters onClick={clipboard.copy}>
        <ListItemIcon>
          <Icon name={clipboard.copied ? 'check' : icon} color={clipboard.copied ? 'success' : undefined} size="md" />
        </ListItemIcon>
        <ListItemText primary={clipboard.copied ? 'Copied!' : 'Copy Sharable Link'} />
        <input type="hidden" ref={clipboard.target} value={title} />
      </MenuItem>
      <input type="hidden" ref={clipboard.target} value={value} />
    </>
  )
}

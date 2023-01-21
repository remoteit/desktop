import React from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Icon, IconProps } from './Icon'

export type CopyMenuItemProps = {
  icon: string
  title?: string
  value?: string | number
  disabled?: boolean
  awaitCopy?: () => Promise<any>
  iconProps?: IconProps
  className?: string
}

export const CopyMenuItem: React.FC<CopyMenuItemProps> = ({
  icon,
  value,
  title,
  disabled,
  awaitCopy,
  iconProps,
  className,
}) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <MenuItem
      dense
      onClick={async () => {
        await awaitCopy?.()
        clipboard.copy()
      }}
      disabled={disabled}
      className={className}
    >
      <ListItemIcon>
        <Icon
          name={clipboard.copied ? 'check' : icon}
          color={clipboard.copied ? 'success' : undefined}
          size="md"
          {...iconProps}
        />
      </ListItemIcon>
      <ListItemText primary={clipboard.copied ? 'Copied!' : title} />
      <input type="hidden" ref={clipboard.target} value={value} />
    </MenuItem>
  )
}

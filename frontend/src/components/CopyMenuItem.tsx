import React, { useState } from 'react'
import useClipboard from '../hooks/useClipboard'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Icon, IconProps } from './Icon'

export type CopyMenuItemProps = {
  icon: string
  title?: string
  value?: string | number
  disabled?: boolean
  awaitCopy?: () => Promise<void>
  onCopied?: () => void
  iconProps?: IconProps
  className?: string
}

export const CopyMenuItem: React.FC<CopyMenuItemProps> = ({
  icon,
  value,
  title,
  disabled,
  awaitCopy,
  onCopied,
  iconProps,
  className,
}) => {
  const [copiedClicked, setCopiedClicked] = useState(false)
  const clipboard = useClipboard({ copiedTimeout: 1000, onCopied })
  return (
    <MenuItem
      dense
      onClick={async () => {
        await awaitCopy?.()
        clipboard.copy(value)
        setCopiedClicked(true)
      }}
      disabled={disabled}
      className={className}
    >
      <ListItemIcon>
        <Icon
          name={copiedClicked ? 'check' : icon}
          color={copiedClicked ? 'success' : undefined}
          size="md"
          {...iconProps}
        />
      </ListItemIcon>
      <ListItemText primary={copiedClicked ? 'Copied!' : title} />
    </MenuItem>
  )
}

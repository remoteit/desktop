import React from 'react'
import useClipboard from '../hooks/useClipboard'
import { ListItemButton, DataButtonProps } from '../buttons/ListItemButton'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'

type Props = Omit<DataButtonProps, 'title' | 'onClick' | 'icon'> & {
  hideIcon?: boolean
  link?: string
}

export const ListItemCopy: React.FC<Props> = ({ hideIcon, link, ...props }) => {
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  if (!props.value) return null

  return (
    <ListItemButton
      {...props}
      title={clipboard.copied ? 'Copied!' : props.label ? `Copy ${props.label}` : 'Copy'}
      icon={hideIcon ? null : clipboard.copied ? 'check' : 'clone'}
      iconColor={clipboard.copied ? 'success' : undefined}
      onClick={() => clipboard.copy(props.value)}
      action={
        link ? (
          <IconButton
            size="xl"
            icon="launch"
            color="primary"
            variant="contained"
            onClick={() => (window.location.href = link)}
            sx={{
              minHeight: 80,
              width: 80,
              marginRight: `${-spacing.xxl}px`,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          />
        ) : undefined
      }
    />
  )
}

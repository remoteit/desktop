import React from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch } from '@material-ui/core'
import { Icon } from '../Icon'

// React.ComponentProps<typeof ListItem> &
type Props = {
  icon?: string
  label: string
  subLabel?: string
  value?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const SettingsListItem: React.FC<Props> = ({ icon, label, subLabel, value, onClick, disabled }) => {
  const showToggle = value !== undefined
  if (!onClick) disabled = true
  return (
    <ListItem button onClick={onClick} disabled={disabled} style={{ opacity: 1 }}>
      <ListItemIcon>
        <Icon name={icon} size="md" weight="light" />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      {showToggle && (
        <ListItemSecondaryAction>
          <Switch edge="end" checked={value} onClick={onClick} />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  )
}

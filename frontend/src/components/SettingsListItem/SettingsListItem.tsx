import React from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch } from '@material-ui/core'
import { Icon } from '../Icon'

type Props = React.ComponentProps<typeof ListItem> & {
  icon?: string
  label: string
  subLabel?: string
  value?: boolean
  onClick?: () => void
}

export const SettingsListItem: React.FC<Props> = ({ icon, label, subLabel, value, onClick, ...props }) => {
  const showToggle = value !== undefined
  return (
    <ListItem onClick={onClick} {...props}>
      <ListItemIcon>
        <Icon name={icon} size="md" weight="regular" />
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

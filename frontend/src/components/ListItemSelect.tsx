import React from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, TextField, MenuItem } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  icon?: string
  label: React.ReactNode
  subLabel?: React.ReactNode
  value?: string | number
  options: { label: string; value?: string }[]
  onChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>
  disabled?: boolean
}

export const ListItemSelect: React.FC<Props> = ({ icon, label, subLabel, value, options, onChange, disabled }) => {
  return (
    <ListItem disabled={disabled} dense>
      <ListItemIcon>
        <Icon name={icon} size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      <ListItemSecondaryAction>
        <TextField
          select
          hiddenLabel
          size="small"
          disabled={disabled}
          value={value}
          variant="filled"
          onChange={onChange}
        >
          {options.map(option => (
            <MenuItem dense value={option.value} selected={value === option.value} key={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

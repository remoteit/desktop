import React, { useState } from 'react'
import { ListItem, ListItemIcon, MenuItem, TextField } from '@mui/material'
import { Icon } from './Icon'

type Props = {
  label: string
  value: string | number
  values: ISelect[]
  icon: string
  disabled?: boolean
  modified?: boolean
  onChange?: (value: string) => void
}

export const SelectSetting: React.FC<Props> = ({ label, value, values, icon, disabled, modified, onChange }) => {
  const [open, setOpen] = useState<boolean>(false)
  const handleClick = () => setOpen(!open)

  return (
    <ListItem dense onClick={handleClick} disabled={disabled} button>
      <ListItemIcon>
        <Icon name={icon} size="md" modified={modified} fixedWidth />
      </ListItemIcon>
      <TextField
        select
        fullWidth
        variant="standard"
        disabled={disabled}
        SelectProps={{ open }}
        label={label}
        value={value}
        onChange={e => {
          handleClick()
          onChange && onChange(e.target.value)
        }}
      >
        {values.map(type => (
          <MenuItem value={type.key} key={type.key}>
            {type.name}
          </MenuItem>
        ))}
      </TextField>
    </ListItem>
  )
}

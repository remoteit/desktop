import React, { useState } from 'react'
import { ListItem, ListItemIcon, ListItemSecondaryAction, MenuItem, TextField, Tooltip } from '@mui/material'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  label: string
  value?: string | number
  values: ISelect[]
  icon?: string
  disabled?: boolean
  modified?: boolean
  hideIcon?: boolean
  helpMessage?: string
  onChange?: (value: string) => void
  children?: React.ReactNode
}

export const SelectSetting: React.FC<Props> = ({
  label,
  value,
  values,
  icon,
  hideIcon,
  disabled,
  modified,
  helpMessage,
  onChange,
  children,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const handleClick = () => setOpen(!open)

  return (
    <ListItem dense onClick={handleClick} disabled={disabled} button>
      <ListItemIcon sx={{ minWidth: hideIcon ? spacing.sm : undefined }}>
        {hideIcon ? null : <Icon name={icon} size="md" modified={modified} fixedWidth />}
      </ListItemIcon>
      <TextField
        select
        fullWidth
        variant="standard"
        SelectProps={{ open }}
        label={
          <>
            {label}
            {helpMessage && (
              <Tooltip title={helpMessage} placement="top" arrow>
                <span style={{ zIndex: 10 }}>
                  <Icon name="question-circle" size="sm" inline />
                </span>
              </Tooltip>
            )}
          </>
        }
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
      {children && <ListItemSecondaryAction>{children}</ListItemSecondaryAction>}
    </ListItem>
  )
}

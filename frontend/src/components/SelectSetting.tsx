import React, { useState } from 'react'
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Typography,
  TextField,
  TextFieldProps,
  Tooltip,
} from '@mui/material'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = Omit<TextFieldProps, 'onChange'> & {
  label?: string
  value?: string | number
  values: ISelect[]
  icon?: string
  modified?: boolean
  hideIcon?: boolean
  helpMessage?: string
  defaultValue?: string | number
  disableGutters?: boolean
  onChange?: (value: string) => void
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
  defaultValue,
  disableGutters,
  onChange,
  children,
  ...props
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const handleClick = () => setOpen(!open)

  modified = modified || (!!defaultValue && value !== defaultValue)

  return (
    <ListItemButton dense onClick={handleClick} disabled={disabled} disableGutters={disableGutters}>
      <ListItemIcon sx={{ minWidth: hideIcon ? spacing.sm : undefined }}>
        {hideIcon ? null : <Icon name={icon} size="md" modified={modified} fixedWidth />}
      </ListItemIcon>
      <TextField
        {...props}
        select
        fullWidth
        variant="standard"
        SelectProps={{ open, renderValue: value => values.find(r => r.key === value)?.name }}
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
          <MenuItem value={type.key} key={type.key} disabled={type.disabled} sx={{ display: 'block', paddingY: 1.3 }}>
            <ListItemText>{type.name}</ListItemText>
            {type.description && (
              <Typography
                variant="caption"
                sx={{
                  width: 'calc(100% - 48px)',
                  display: 'block',
                  whiteSpace: 'wrap',
                }}
              >
                {type.description}
              </Typography>
            )}
            {defaultValue === type.key && (
              <ListItemSecondaryAction>
                <Typography variant="caption">default</Typography>
              </ListItemSecondaryAction>
            )}
          </MenuItem>
        ))}
      </TextField>
      {children && <ListItemSecondaryAction>{children}</ListItemSecondaryAction>}
    </ListItemButton>
  )
}

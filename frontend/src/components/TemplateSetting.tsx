import React from 'react'
import { ListItem, TextField, Typography } from '@material-ui/core'

type Props = {
  label: string
  value?: string
  disabled: boolean
  onChange: (value: string) => void
  className?: string
}

export const TemplateSetting: React.FC<Props> = ({ label, value, disabled, onChange, className, children }) => {
  return (
    <ListItem dense className={className}>
      <TextField
        label={label}
        value={value}
        disabled={disabled}
        variant="filled"
        onChange={event => onChange(event.target.value)}
        multiline={true}
      />
      <Typography variant="caption">{children}</Typography>
    </ListItem>
  )
}

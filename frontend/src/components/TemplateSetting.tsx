import React from 'react'
import { Application } from '../shared/applications'
import { newConnection } from '../helpers/connectionHelper'
import { ListItem, TextField, Typography } from '@material-ui/core'

type Props = {
  label: string
  value?: string
  disabled: boolean
  onChange: (value: string) => void
  className?: string
}

export const TemplateSetting: React.FC<Props> = ({ label, value, disabled, onChange, className, children }) => {
  const connection = newConnection(null, 33000)
  return (
    <ListItem className={className}>
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

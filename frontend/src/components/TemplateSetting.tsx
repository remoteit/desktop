import React from 'react'
import { useApplication } from '../shared/applications'
import { newConnection } from '../helpers/connectionHelper'
import { ListItem, TextField, Typography } from '@material-ui/core'

type Props = {
  label: string
  value?: string
  type: number
  disabled: boolean
  username?: string
  onChange: (value: string) => void
  className?: string
}

export const TemplateSetting: React.FC<Props> = ({ label, value, type, username, disabled, onChange, className }) => {
  const app = useApplication(type)
  const connection = newConnection(null, 33000)
  return (
    <ListItem className={className}>
      <TextField
        label={label}
        value={value}
        disabled={disabled}
        variant="filled"
        onChange={event => onChange(event.target.value)}
      />
      <Typography variant="caption">
        Replacement tokens {app.tokens}
        <br />
        <b>{app.parse(value, { ...connection, username })}</b>
      </Typography>
    </ListItem>
  )
}

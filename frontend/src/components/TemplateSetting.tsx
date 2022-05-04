import React from 'react'
import { ListItem, TextField, TextFieldProps, Typography } from '@material-ui/core'

type Props = TextFieldProps & {
  onChange: (value: string) => void
  className?: string
}

export const TemplateSetting: React.FC<Props> = ({ onChange, className, children, ...props }) => {
  return (
    <ListItem dense className={className}>
      <TextField {...props} variant="filled" onChange={event => onChange(event.target.value)} multiline={true} />
      <Typography variant="caption">{children}</Typography>
    </ListItem>
  )
}

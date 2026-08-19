import React from 'react'
import { ListItem, TextField, TextFieldProps, Typography } from '@mui/material'

type Props = TextFieldProps & {
  onChange: (value: string) => void
}

export const TemplateSetting: React.FC<Props> = ({ onChange, sx, children, ...props }) => {
  return (
    <ListItem dense sx={sx}>
      <TextField {...props} variant="filled" onChange={event => onChange(event.target.value)} multiline={true} />
      <Typography variant="caption">{children}</Typography>
    </ListItem>
  )
}

import React from 'react'
import { TextField, TextFieldProps } from '@mui/material'
import { FormField } from './FormField'

type Props = TextFieldProps & {
  onChange: (value: string) => void
}

export const TemplateSetting: React.FC<Props> = ({ onChange, children, ...props }) => {
  return (
    <FormField help={children}>
      <TextField
        {...props}
        variant="filled"
        InputLabelProps={{ shrink: true }}
        onChange={event => onChange(event.target.value)}
        multiline={true}
      />
    </FormField>
  )
}

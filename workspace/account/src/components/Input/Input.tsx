import { Box, makeStyles, TextField } from '@material-ui/core'
import React, { forwardRef } from 'react'

export interface Props{
  block?: boolean
  className?: string
  large?: boolean
  size?: "small" | "medium"
  textarea?: boolean
  type?: string
  placeholder?: string
  variant?: "outlined" | "filled" | "standard" 
  onchange?: (e: any) => void
}

export const Input = forwardRef(
  (
    {
      block = false,
      className = '',
      large = false,
      size = 'small',
      textarea = false,
      type = '',
      placeholder = '',
      variant = 'outlined',
      onchange = undefined,
      ...props
    }: Props,
    ref: any
  ) => {
    const css = useStyles()
    
    return (
      <Box mb={4}>
        <TextField size={size} type={type} label={placeholder} variant={variant} className={css.input} onChange={onchange}/>
      </Box>
    )
  }
)

const useStyles = makeStyles({
  input: {
    fontSize: 10,
    minWidth: 350,
  }
})

import React, { useEffect, useState, useRef } from 'react'
import { makeStyles } from '@mui/styles'
import { TextField, TextFieldProps, Input } from '@mui/material'
import { InlineSetting } from './InlineSetting'
import { spacing } from '../styling'

type Props = {
  value?: string | number
  label?: React.ReactNode
  icon?: React.ReactNode
  actionIcon?: React.ReactNode
  displayValue?: string | number
  filter?: RegExp
  color?: string
  required?: boolean
  disabled?: boolean
  resetValue?: string | number
  maxLength?: number
  hideIcon?: boolean
  warning?: React.ReactNode
  modified?: boolean
  disableGutters?: boolean
  debug?: boolean
  onError?: (value: string | undefined) => void
  onSave?: (value: string | number) => void
  onDelete?: () => void
}

export const InlineTextFieldSetting: React.FC<Props> = ({
  label,
  filter,
  required,
  value = '',
  resetValue = '',
  maxLength,
  onError,
  onSave,
  ...props
}) => {
  const fieldRef = useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = useState<string | number>('')
  const [error, setError] = useState<string>()
  const css = useStyles()

  useEffect(() => {
    onError && onError(error)
  }, [error])

  let Field
  let FieldProps: TextFieldProps = {}

  if (label) {
    Field = TextField
    FieldProps.helperText = error
  } else {
    Field = Input
  }

  return (
    <InlineSetting
      {...props}
      label={label}
      value={value}
      fieldRef={fieldRef}
      resetValue={resetValue}
      onResetClick={() => setEditValue(resetValue)}
      onSubmit={() => onSave && onSave(editValue)}
      onCancel={() => setEditValue(value)}
      onShowEdit={() => setEditValue(value)}
    >
      <Field
        {...FieldProps}
        autoFocus
        multiline={value?.toString().length > 30}
        inputRef={fieldRef}
        label={label}
        error={!!error}
        value={editValue}
        variant="filled"
        className={css.field}
        onChange={event => {
          let value = event.target.value
          if (required && !value.length) {
            setError(`Required field`)
          } else if (maxLength && value.length > maxLength) {
            setError(`Cannot exceed ${maxLength} characters`)
            value = value.substring(0, maxLength)
          } else if (filter && value.length > 1) {
            const original = value.trim()
            value = value.replace(filter, '')
            if (original !== value.trim()) {
              setError(`Invalid character. (${original.replace(value, '')})`)
            } else {
              setError(undefined)
            }
          } else {
            setError(undefined)
          }
          setEditValue(value)
        }}
      />
    </InlineSetting>
  )
}

const useStyles = makeStyles({
  field: {
    flexGrow: 1,
    margin: `0 ${spacing.md}px -1px -${spacing.sm}px`,
    '& .MuiFilledInput-root': { marginRight: spacing.sm, padding: '3px 0 2px', fontSize: 14 },
    '& .MuiFormControl-root': { flexGrow: 1, margin: `0 ${spacing.md}px -1px ${spacing.sm}px` },
  },
})

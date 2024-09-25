import React, { useEffect, useState, useRef } from 'react'
import { TextField, TextFieldProps, Input, InputProps } from '@mui/material'
import { FormDisplayProps } from './FormDisplay'
import { InlineSetting } from './InlineSetting'
import { spacing } from '../styling'

export type InlineTextFieldSettingProps = {
  value?: string | number
  label?: React.ReactNode
  icon?: React.ReactNode
  placeholder?: TextFieldProps['placeholder']
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
  autoCorrect?: boolean
  multiline?: boolean
  type?: InputProps['type']
  debug?: boolean
  fieldProps?: TextFieldProps
  DisplayComponent?: React.ReactElement<FormDisplayProps>
  onError?: (value: string | undefined) => void
  onSave?: (value: string | number) => void
  onDelete?: () => void
}

export const InlineTextFieldSetting: React.FC<InlineTextFieldSettingProps> = ({
  label,
  filter,
  required,
  value = '',
  resetValue,
  placeholder,
  maxLength,
  autoCorrect,
  multiline,
  type,
  fieldProps = {},
  onError,
  onSave,
  ...props
}) => {
  const fieldRef = useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = useState<string | number>('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    onError && onError(error)
  }, [error])

  let Field
  fieldProps.type = type

  if (label) {
    Field = TextField
    fieldProps.helperText = error
  } else {
    Field = Input
  }

  multiline = multiline === undefined ? value?.toString().length > 50 : multiline

  return (
    <InlineSetting
      {...props}
      label={label}
      value={value}
      fieldRef={fieldRef}
      resetValue={resetValue}
      onResetClick={() => onSave && onSave(resetValue || '')}
      onSubmit={() => onSave && onSave(editValue)}
      onCancel={() => setEditValue(value)}
      onShowEdit={() => setEditValue(value)}
    >
      <Field
        {...fieldProps}
        autoFocus
        multiline={multiline}
        inputRef={fieldRef}
        label={label}
        error={!!error}
        value={editValue || ''}
        variant="filled"
        placeholder={placeholder}
        sx={{
          ...fieldProps.sx,
          flexGrow: 1,
          margin: `0 ${spacing.md}px -1px -${spacing.sm}px`,
          '& .MuiFilledInput-root': { marginRight: spacing.sm, padding: '3px 0 2px', fontSize: 14 },
          '& .MuiFormControl-root': { flexGrow: 1, margin: `0 ${spacing.md}px -1px ${spacing.sm}px` },
        }}
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
              if (!autoCorrect) setError(`Invalid character. (${original.replace(value, '')})`)
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

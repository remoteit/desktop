import React, { useEffect, useState, useRef } from 'react'
import { TextField } from '@material-ui/core'
import { InlineSetting } from '../InlineSetting'

type Props = {
  value?: string | number
  label: string | JSX.Element
  icon?: JSX.Element | string
  actionIcon?: JSX.Element
  displayValue?: string | number
  filter?: RegExp
  disabled?: boolean
  resetValue?: string | number
  maxLength?: number
  hideIcon?: boolean
  onError?: (value: string | undefined) => void
  onSave?: (value: string | number) => void
}

export const InlineTextFieldSetting: React.FC<Props> = ({
  label,
  filter,
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

  useEffect(() => {
    onError && onError(error)
  }, [error])

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
      <TextField
        autoFocus
        multiline={value.toString().length > 30}
        inputRef={fieldRef}
        label={label}
        error={!!error}
        value={editValue}
        variant="filled"
        helperText={error}
        onChange={event => {
          let { value } = event.target
          value = filter ? value.replace(filter, '') : value
          if (maxLength && value.length > maxLength) {
            setError(`Cannot exceed ${maxLength} characters.`)
            value = value.substring(0, maxLength)
          } else {
            setError(undefined)
          }
          setEditValue(value)
        }}
      />
    </InlineSetting>
  )
}

import React, { useEffect, useState, useRef } from 'react'
import { makeStyles, TextField, Input } from '@material-ui/core'
import { InlineSetting } from '../InlineSetting'
import { spacing } from '../../styling'

type Props = {
  value?: string | number
  label?: string | JSX.Element
  icon?: JSX.Element | string
  actionIcon?: JSX.Element
  displayValue?: string | number
  filter?: RegExp
  disabled?: boolean
  resetValue?: string | number
  maxLength?: number
  hideIcon?: boolean
  warning?: string
  onError?: (value: string | undefined) => void
  onSave?: (value: string | number) => void
  onDelete?: () => void
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
  const css = useStyles()

  useEffect(() => {
    onError && onError(error)
  }, [error])

  const Field = label ? TextField : Input

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
        autoFocus
        multiline={value?.toString().length > 30}
        inputRef={fieldRef}
        label={label}
        error={!!error}
        value={editValue}
        variant="filled"
        className={css.field}
        helperText={error}
        onChange={event => {
          let { value } = event.target
          value = filter && value.length > 1  ? value.replace(filter, '') : value
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

const useStyles = makeStyles({
  field: {
    flexGrow: 1,
    margin: `0 ${spacing.md}px -1px -${spacing.sm}px`,
    '& .MuiInput-root': { marginRight: spacing.sm, padding: '3px 0 2px', fontSize: 14 },
    '& .MuiFormControl-root': { flexGrow: 1, margin: `0 ${spacing.md}px -1px ${spacing.sm}px` },
  },
})

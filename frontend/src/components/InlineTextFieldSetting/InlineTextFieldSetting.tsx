import React, { useState, useEffect, useRef } from 'react'
import { TextField } from '@material-ui/core'
import { InlineSetting } from '../InlineSetting'

type Props = {
  value?: string | number
  label: string
  icon?: JSX.Element
  displayValue?: string | number
  filter?: RegExp
  disabled?: boolean
  resetValue?: string | number
  onSave: (value: string | number) => void
}

export const InlineTextFieldSetting: React.FC<Props> = ({
  label,
  filter,
  value = '',
  resetValue = '',
  onSave,
  ...props
}) => {
  const fieldRef = useRef<HTMLInputElement>(null)
  const [editValue, setEditValue] = useState<string | number>('')

  return (
    <InlineSetting
      {...props}
      label={label}
      value={value}
      fieldRef={fieldRef}
      resetValue={resetValue}
      onResetClick={() => setEditValue(resetValue)}
      onSubmit={() => onSave(editValue)}
      onCancel={() => setEditValue(value)}
      onShowEdit={() => setEditValue(value)}
    >
      <TextField
        autoFocus
        inputRef={fieldRef}
        label={label}
        value={editValue}
        variant="filled"
        onChange={event => setEditValue(filter ? event.target.value.replace(filter, '') : event.target.value)}
      />
    </InlineSetting>
  )
}

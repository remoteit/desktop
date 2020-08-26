import React, { useState, useRef } from 'react'
import { FormControl, InputLabel, Select } from '@material-ui/core'
import { InlineSetting } from '../InlineSetting'

type Props = {
  label: string
  value: string | number
  values: ISelect[]
  icon?: JSX.Element
  displayValue?: string | number
  disabled?: boolean
  resetValue?: string | number
  onSave: (value: string | number) => void
}

export const InlineSelectSetting: React.FC<Props> = ({
  label,
  value,
  values = [],
  resetValue = '',
  onSave,
  ...props
}) => {
  const fieldRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<boolean>(true)
  const [editValue, setEditValue] = useState<string | number>('')

  return (
    <InlineSetting
      {...props}
      label={label}
      value={values.find(v => v.id === value)?.name}
      fieldRef={fieldRef}
      resetValue={resetValue}
      onResetClick={() => setEditValue(resetValue)}
      onSubmit={() => onSave(editValue)}
      onCancel={() => setEditValue(value)}
      onShowEdit={() => setEditValue(value)}
    >
      <FormControl>
        <InputLabel>{label}</InputLabel>
        <Select
          native
          autoFocus
          open={open}
          inputRef={fieldRef}
          disableUnderline
          value={editValue}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          onChange={event => {
            setOpen(false)
            setEditValue(event.target.value as number | string)
          }}
        >
          {values.map(type => (
            <option value={type.id} key={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
      </FormControl>
    </InlineSetting>
  )
}

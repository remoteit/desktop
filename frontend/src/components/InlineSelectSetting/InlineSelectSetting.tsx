import React, { useState, useRef } from 'react'
import { FormControl, InputLabel, Select } from '@material-ui/core'
import { InlineSetting } from '../InlineSetting'

type Props = {
  label: string
  value: string | number
  values: ISelect[]
  icon?: JSX.Element | string
  displayValue?: string | number
  disabled?: boolean
  resetValue?: string | number
  modified?: boolean
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
  const [editValue, setEditValue] = useState<string | number>('')

  return (
    <InlineSetting
      {...props}
      label={label}
      value={values.find(v => v.key === value)?.name}
      fieldRef={fieldRef}
      resetValue={resetValue}
      onResetClick={() => setEditValue(resetValue)}
      onSubmit={() => onSave(editValue)}
      onCancel={() => setEditValue(value)}
      onShowEdit={() => setEditValue(value)}
    >
      <FormControl className="select">
        <InputLabel shrink>{label}</InputLabel>
        <Select
          native
          autoFocus
          inputRef={fieldRef}
          disableUnderline
          value={editValue}
          onChange={event => setEditValue(event.target.value as number | string)}
        >
          {values.map(type => (
            <option value={type.key} key={type.key}>
              {type.name}
            </option>
          ))}
        </Select>
      </FormControl>
    </InlineSetting>
  )
}

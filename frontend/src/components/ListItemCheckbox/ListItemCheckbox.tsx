import React, { useRef } from 'react'
import { Icon } from '../Icon'
import { ListItem, ListItemText, ListItemIcon, Checkbox } from '@material-ui/core'

type Props = {
  keyProp?: string | number
  label: string | React.ReactNode
  subLabel?: string | React.ReactNode
  disabled?: boolean
  checked?: boolean
  indeterminate?: boolean
  onClick: (checked: boolean) => void
}

export const ListItemCheckbox: React.FC<Props> = ({
  label,
  subLabel,
  disabled,
  checked,
  indeterminate,
  onClick,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ListItem disabled={disabled} button dense onClick={() => inputRef.current?.click()}>
      <ListItemIcon>
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          inputRef={inputRef}
          onChange={event => onClick(event.target.checked)}
          onClick={event => event.stopPropagation()}
          checkedIcon={<Icon name="check-square" size="md" type="solid" />}
          indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
          icon={<Icon name="square" size="md" />}
          color="primary"
        />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      {children}
    </ListItem>
  )
}

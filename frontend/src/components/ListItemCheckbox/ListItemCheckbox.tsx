import React, { useRef } from 'react'
import { Icon } from '../Icon'
import { ListItem, ListItemText, ListItemIcon, Checkbox } from '@material-ui/core'

type Props = {
  keyProp?: string | number
  label: string
  subLabel?: string | React.ReactNode
  disabled?: boolean
  checked?: boolean
  onClick: (checked: boolean) => void
}

export const ListItemCheckbox: React.FC<Props> = ({ label, subLabel, disabled, checked, onClick, children }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ListItem disabled={disabled} button dense onClick={() => inputRef.current?.click()}>
      <ListItemIcon>
        <Checkbox
          checked={checked}
          inputRef={inputRef}
          onChange={event => onClick(event.target.checked)}
          onClick={event => event.stopPropagation()}
          checkedIcon={<Icon name="check-square" size="lg" type="solid" />}
          icon={<Icon name="square" size="lg" type="light" />}
          color="primary"
        />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      {children}
    </ListItem>
  )
}

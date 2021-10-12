import React, { useRef } from 'react'
import { Icon } from './Icon'
import { ListItem, ListItemText, ListItemIcon, Radio } from '@material-ui/core'

type Props = {
  keyProp?: string | number
  label: string | React.ReactNode
  subLabel?: string | React.ReactNode
  disabled?: boolean
  checked?: boolean
  onClick: (checked: boolean) => void
}

export const ListItemRadio: React.FC<Props> = ({ label, subLabel, disabled, checked, onClick, children }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ListItem disabled={disabled} button dense onClick={() => inputRef.current?.click()}>
      <ListItemIcon>
        <Radio
          checked={checked}
          inputRef={inputRef}
          onChange={event => onClick(event.target.checked)}
          onClick={event => event.stopPropagation()}
          checkedIcon={<Icon name="check-circle" size="md" type="solid" />}
          icon={<Icon name="circle" size="md" />}
          color="primary"
        />
      </ListItemIcon>
      <ListItemText primary={label} secondary={subLabel} />
      {children}
    </ListItem>
  )
}

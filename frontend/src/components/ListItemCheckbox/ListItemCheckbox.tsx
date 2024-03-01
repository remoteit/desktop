import React, { useRef } from 'react'
import { Icon } from '../Icon'
import { ListItemButton, ListItemButtonProps, ListItemText, ListItemIcon, Checkbox } from '@mui/material'

type Props = Omit<ListItemButtonProps, 'onClick'> & {
  label: string | React.ReactNode
  subLabel?: string | React.ReactNode
  height?: number
  checked?: boolean
  indeterminate?: boolean
  onClick: (checked: boolean) => void
}

export const ListItemCheckbox: React.FC<Props> = ({
  label,
  subLabel,
  height,
  disabled,
  checked,
  indeterminate,
  disableGutters,
  onClick,
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <ListItemButton
      dense
      disabled={disabled}
      sx={{ height }}
      disableGutters={disableGutters}
      onClick={() => inputRef.current?.click()}
    >
      <ListItemIcon>
        <Checkbox
          checked={!!checked}
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
    </ListItemButton>
  )
}

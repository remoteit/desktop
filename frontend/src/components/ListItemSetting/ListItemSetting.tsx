import React, { useState } from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, Button } from '@material-ui/core'
import { Confirm } from '../Confirm'
import { Icon } from '../Icon'

// React.ComponentProps<typeof ListItem> &
type Props = {
  icon?: string
  label: string
  subLabel?: string | React.ReactNode
  button?: string
  toggle?: boolean
  disabled?: boolean
  confirm?: boolean
  confirmMessage?: string
  confirmTitle?: string
  onClick?: () => void
}

export const ListItemSetting: React.FC<Props> = ({
  icon,
  label,
  subLabel,
  button,
  toggle,
  onClick,
  disabled,
  confirm,
  confirmMessage = 'Are you sure?',
  confirmTitle = '',
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const showToggle = toggle !== undefined
  const showButton = button !== undefined

  if (!onClick) {
    disabled = true
    confirm = false
  }

  const handleClick = () => {
    if (confirm) setOpen(true)
    else onClick && onClick()
  }

  return (
    <>
      <ListItem button onClick={handleClick} disabled={disabled} style={{ opacity: 1 }} dense>
        <ListItemIcon>
          <Icon name={icon} size="md" type="light" />
        </ListItemIcon>
        <ListItemText primary={label} secondary={subLabel} />
        {(showToggle || showButton) && (
          <ListItemSecondaryAction>
            {showButton ? (
              <Button onClick={onClick} color="secondary">
                {button}
              </Button>
            ) : (
              <Switch edge="end" color="primary" disabled={disabled} checked={toggle} onClick={onClick} />
            )}
          </ListItemSecondaryAction>
        )}
      </ListItem>
      {confirm && onClick && (
        <Confirm open={open} onConfirm={onClick} onDeny={() => setOpen(false)} title={confirmTitle}>
          {confirmMessage}
        </Confirm>
      )}
    </>
  )
}

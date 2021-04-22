import React, { useState } from 'react'
import { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, Button } from '@material-ui/core'
import { Confirm } from '../Confirm'
import { Quote } from '../Quote'
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
  quote?: boolean
  onClick?: () => void
  onButtonClick?: () => void
}

export const ListItemSetting = React.forwardRef(
  ({
    icon,
    label,
    subLabel,
    button,
    toggle,
    onClick,
    onButtonClick,
    disabled,
    quote,
    confirm,
    confirmMessage = 'Are you sure?',
    confirmTitle = '',
  }: Props): JSX.Element => {
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

    const handleConfirm = () => {
      onClick && onClick()
      setOpen(false)
    }

    const ListItemContent = <ListItemText primary={label} secondary={subLabel} />

    return (
      <>
        <ListItem button onClick={handleClick} disabled={disabled} dense>
          <ListItemIcon>
            <Icon name={icon} size="md" />
          </ListItemIcon>
          {quote ? <Quote margin={0}>{ListItemContent}</Quote> : ListItemContent}
          <ListItemSecondaryAction>
            {showButton && (
              <Button onClick={onButtonClick} size="small">
                {button}
              </Button>
            )}
            {showToggle && <Switch edge="end" color="primary" disabled={disabled} checked={toggle} onClick={onClick} />}
          </ListItemSecondaryAction>
        </ListItem>
        {confirm && onClick && (
          <Confirm open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)} title={confirmTitle}>
            {confirmMessage}
          </Confirm>
        )}
      </>
    )
  }
)

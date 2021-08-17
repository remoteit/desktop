import React, { useState, useRef } from 'react'
import {
  Tooltip,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Button,
} from '@material-ui/core'
import { Confirm } from '../Confirm'
import { Quote } from '../Quote'
import { Icon } from '../Icon'
import { Color } from '../../styling'

// React.ComponentProps<typeof ListItem> &
type Props = {
  icon?: string
  iconColor?: Color
  label: string | React.ReactElement
  subLabel?: string | React.ReactElement
  button?: string
  toggle?: boolean
  tooltip?: string
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
    iconColor,
    label,
    subLabel,
    button,
    toggle,
    tooltip,
    onClick,
    onButtonClick,
    disabled,
    quote,
    confirm,
    confirmMessage = 'Are you sure?',
    confirmTitle = '',
  }: Props): JSX.Element => {
    const [open, setOpen] = useState<boolean>(false)
    const [showTip, setShowTip] = useState<boolean>(false)
    const iconRef = useRef<HTMLDivElement>(null)
    const showToggle = toggle !== undefined
    const showButton = button !== undefined

    if (!onClick) confirm = false

    const handleClick = () => {
      if (confirm) setOpen(true)
      else onClick && onClick()
    }

    const handleConfirm = () => {
      onClick && onClick()
      setOpen(false)
    }

    const ListItemContent = <ListItemText primary={label} secondary={subLabel} />
    const TooltipWrapper = ({ children }) =>
      tooltip ? (
        <Tooltip title={tooltip} placement="top" open={showTip} arrow>
          {children}
        </Tooltip>
      ) : (
        children
      )

    return (
      <>
        <ListItem
          button={!!onClick as true}
          onClick={handleClick}
          disabled={disabled}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          dense
        >
          <TooltipWrapper>
            <ListItemIcon>
              <Icon ref={iconRef} name={icon} color={iconColor} size="md" />
            </ListItemIcon>
          </TooltipWrapper>
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

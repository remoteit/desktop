import React, { useState, useRef } from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, Button } from '@mui/material'
import { Confirm } from '../Confirm'
import { Quote } from '../Quote'
import { Icon } from '../Icon'
import { Color, spacing } from '../../styling'

type Props = {
  icon?: string
  iconColor?: Color
  hideIcon?: boolean
  label: React.ReactNode
  subLabel?: React.ReactNode
  size?: 'small' | 'medium'
  button?: string
  toggle?: boolean
  tooltip?: string
  disabled?: boolean
  confirm?: boolean
  confirmMessage?: React.ReactNode
  confirmTitle?: string
  quote?: boolean
  modified?: boolean
  onClick?: () => void
  onButtonClick?: () => void
}

export const ListItemSetting = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      icon,
      iconColor,
      hideIcon,
      label,
      subLabel,
      size,
      button,
      toggle,
      tooltip,
      onClick,
      onButtonClick,
      disabled,
      quote,
      modified,
      confirm,
      confirmMessage = 'Are you sure?',
      confirmTitle = '',
    },
    ref
  ) => {
    const [open, setOpen] = useState<boolean>(false)
    const [showTip, setShowTip] = useState<boolean>(false)
    const iconRef = useRef<HTMLDivElement>(null)
    const showToggle = toggle !== undefined
    const showButton = button !== undefined
    const css = useStyles()

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
          dense
          ref={ref}
          button={!!onClick as true}
          onClick={handleClick}
          disabled={disabled}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          <TooltipWrapper>
            <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>
              <Icon ref={iconRef} name={icon} color={iconColor} size="md" modified={modified} fixedWidth />
            </ListItemIcon>
          </TooltipWrapper>
          {quote ? <Quote margin={null}>{ListItemContent}</Quote> : ListItemContent}
          <ListItemSecondaryAction>
            {showButton && (
              <Button onClick={onButtonClick} size="small">
                {button}
              </Button>
            )}
            {showToggle && (
              <Switch edge="end" color="primary" disabled={disabled} checked={toggle} onClick={onClick} size={size} />
            )}
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

const useStyles = makeStyles({
  hideIcon: { minWidth: spacing.sm },
})

import React, { useState, useRef } from 'react'
import {
  Tooltip,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Button,
} from '@mui/material'
import { Confirm, ConfirmProps } from '../Confirm'
import { Icon, IconProps } from '../Icon'
import { spacing } from '../../styling'
import { Quote } from '../Quote'

type Props = {
  icon?: React.ReactNode
  iconColor?: IconProps['color']
  iconType?: IconProps['type']
  hideIcon?: boolean
  label?: React.ReactNode
  subLabel?: React.ReactNode
  size?: 'small' | 'medium'
  button?: React.ReactNode
  toggle?: boolean
  tooltip?: string
  disabled?: boolean
  confirm?: boolean
  confirmProps?: Omit<ConfirmProps, 'open' | 'onConfirm' | 'onDeny'>
  quote?: boolean
  modified?: boolean
  disableGutters?: boolean
  content?: React.ReactNode
  secondaryContent?: React.ReactNode
  secondaryContentWidth?: string | number
  onClick?: () => void
  onButtonClick?: () => void
}

export const ListItemSetting = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      icon,
      iconColor,
      iconType,
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
      confirmProps,
      disableGutters,
      content,
      secondaryContent,
      secondaryContentWidth,
    },
    ref
  ) => {
    const [open, setOpen] = useState<boolean>(false)
    const [showTip, setShowTip] = useState<boolean>(false)
    const iconRef = useRef<HTMLDivElement>(null)
    const showToggle = toggle !== undefined
    const showButton = button !== undefined

    secondaryContentWidth = secondaryContentWidth || (showButton || showToggle || secondaryContent ? '60px' : undefined)

    if (!onClick) confirm = false

    const handleClick = () => {
      if (disabled) return
      if (confirm) setOpen(true)
      else onClick?.()
    }

    const handleButtonClick = event => {
      event.stopPropagation()
      onButtonClick?.()
    }

    const handleConfirm = () => {
      onClick?.()
      setOpen(false)
    }

    const ListItemContent = (
      <>
        {(label || subLabel) && <ListItemText primary={label} secondary={subLabel} />}
        {content}
      </>
    )

    // Defining a wrapper component inside render would remount its subtree (and refetch any
    // avatar image) every render, so wrap the icon node with a plain conditional instead.
    const iconNode = (
      <ListItemIcon sx={hideIcon ? { minWidth: `${spacing.sm}px` } : undefined}>
        {typeof icon === 'string' ? (
          <Icon ref={iconRef} name={icon} color={iconColor} size="md" modified={modified} type={iconType} fixedWidth />
        ) : (
          icon
        )}
      </ListItemIcon>
    )

    const ListItemContents = (
      <>
        {tooltip ? (
          <Tooltip title={tooltip} placement="top" open={showTip} arrow>
            {iconNode}
          </Tooltip>
        ) : (
          iconNode
        )}
        {quote ? <Quote margin={null}>{ListItemContent}</Quote> : ListItemContent}
        <ListItemSecondaryAction>
          {secondaryContent}
          {showButton && (
            <Button onClick={handleButtonClick} color="primary" size="small">
              {button}
            </Button>
          )}
          {showToggle && (
            <Switch edge="end" color="primary" disabled={disabled} checked={toggle} onClick={handleClick} size={size} />
          )}
        </ListItemSecondaryAction>
      </>
    )

    return (
      <>
        {disabled || !onClick ? (
          <ListItem dense sx={{ paddingRight: secondaryContentWidth }} disableGutters={disableGutters}>
            {ListItemContents}
          </ListItem>
        ) : (
          <ListItemButton
            dense
            ref={ref}
            onClick={handleClick}
            disabled={disabled}
            disableGutters={disableGutters}
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            sx={{ paddingRight: secondaryContentWidth }}
          >
            {ListItemContents}
          </ListItemButton>
        )}
        {confirm && onClick && (
          <Confirm {...confirmProps} open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)}>
            {confirmProps?.children}
          </Confirm>
        )}
      </>
    )
  }
)

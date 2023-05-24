import React, { useState, useRef } from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, Button } from '@mui/material'
import { Confirm, ConfirmProps } from '../Confirm'
import { Icon, IconProps } from '../Icon'
import { spacing } from '../../styling'
import { Quote } from '../Quote'

type Props = {
  icon?: string
  iconColor?: IconProps['color']
  iconType?: IconProps['type']
  hideIcon?: boolean
  label: React.ReactNode
  subLabel?: React.ReactNode
  size?: 'small' | 'medium'
  button?: string
  toggle?: boolean
  tooltip?: string
  disabled?: boolean
  confirm?: boolean
  confirmProps?: Omit<ConfirmProps, 'open' | 'onConfirm' | 'onDeny'>
  quote?: boolean
  modified?: boolean
  content?: React.ReactNode
  secondaryContent?: React.ReactNode
  secondaryContentWidth?: string
  onClick?: () => void
  onButtonClick?: () => void
}

export const ListItemSetting = React.forwardRef<HTMLLIElement, Props>(
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
    const css = useStyles()

    if (!onClick) confirm = false

    const handleClick = () => {
      if (disabled) return
      if (confirm) setOpen(true)
      else onClick?.()
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
          button={disabled || !onClick ? false : (true as any)}
          onClick={handleClick}
          disabled={disabled}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          {...{ sx: secondaryContentWidth ? { paddingRight: secondaryContentWidth } : undefined }}
        >
          <TooltipWrapper>
            <ListItemIcon className={hideIcon ? css.hideIcon : undefined}>
              <Icon
                ref={iconRef}
                name={icon}
                color={iconColor}
                size="md"
                modified={modified}
                type={iconType}
                fixedWidth
              />
            </ListItemIcon>
          </TooltipWrapper>
          {quote ? <Quote margin={null}>{ListItemContent}</Quote> : ListItemContent}
          <ListItemSecondaryAction>
            {secondaryContent}
            {showButton && (
              <Button onClick={onButtonClick} color="primary" size="small">
                {button}
              </Button>
            )}
            {showToggle && (
              <Switch
                edge="end"
                color="primary"
                disabled={disabled}
                checked={toggle}
                onClick={handleClick}
                size={size}
              />
            )}
          </ListItemSecondaryAction>
        </ListItem>
        {confirm && onClick && (
          <Confirm {...confirmProps} open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)}>
            {confirmProps?.children}
          </Confirm>
        )}
      </>
    )
  }
)

const useStyles = makeStyles({ hideIcon: { minWidth: spacing.sm } })

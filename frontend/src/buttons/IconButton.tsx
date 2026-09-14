import React from 'react'
import { useHistory } from 'react-router-dom'
import { SxProps, Theme, Tooltip, TooltipProps, IconButton as MuiIconButton, darken } from '@mui/material'
import { Icon, IconProps } from '../components/Icon'

type VariantType = 'text' | 'contained' | 'outlined'

export type ButtonProps = Omit<IconProps, 'title'> & {
  to?: string
  /** The tooltip. A STRING title is also the button's accessible name — unless `label` says
   *  otherwise (a title that is a React node, or one that swaps in an explanation). */
  title?: React.ReactNode
  /** The control's stable accessible name, for when `title` cannot be it: a node title
   *  (ServiceKeySetting's "Get the Node.js package" + launch icon), or a title that changes to
   *  a disabled-state explanation ("Manage permission required…") — which must not become
   *  the name of what the button DOES. */
  label?: string
  forceTitle?: boolean
  icon?: string
  name?: string
  sx?: SxProps<Theme>
  disabled?: boolean
  hideDisableFade?: boolean
  iconInlineLeft?: boolean
  buttonBaseSize?: 'small' | 'medium' | 'large'
  variant?: VariantType
  shiftDown?: boolean
  loading?: boolean
  submit?: boolean
  hide?: boolean
  placement?: TooltipProps['placement']
  children?: React.ReactNode
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      to,
      sx = {},
      title,
      label,
      forceTitle,
      icon,
      name,
      disabled,
      hideDisableFade,
      spin,
      color,
      variant,
      shiftDown,
      size = 'base',
      buttonBaseSize,
      inline,
      inlineLeft,
      iconInlineLeft,
      className,
      loading,
      submit,
      hide,
      placement = 'top',
      fixedWidth = true,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const history = useHistory()

    if (hide) return null
    icon = icon || name
    if (loading) {
      icon = 'spinner-third'
      spin = true
    }
    const clickHandler = (e: React.MouseEvent) => {
      if (onClick) onClick(e)
      if (to) history.push(to)
    }

    let updatedSx: SxProps<Theme> = {
      opacity: disabled && !hideDisableFade ? 0.5 : undefined,
      marginBottom: shiftDown ? -0.75 : undefined,
      marginTop: shiftDown ? -0.75 : undefined,
      marginLeft: inline ? 1.5 : undefined,
      marginRight: inlineLeft ? 1.5 : undefined,
      ...sx,
    }

    switch (variant) {
      case 'contained':
        updatedSx = {
          color: 'alwaysWhite.main',
          backgroundColor: `${color || 'primary'}.main`,
          ['&:hover']: {
            backgroundColor: ({ palette }) => darken(palette[color || 'primary'].main, 0.2),
          },
          ...updatedSx,
        }
        break
      case 'outlined':
        updatedSx = {
          border: `1px solid ${color || 'primary'}.main`,
          ...updatedSx,
        }
    }

    const button = (
      <MuiIconButton
        {...{ ref, disabled, onMouseDown, onMouseEnter, onMouseLeave, className }}
        // Name the BUTTON. The Tooltip below wraps a <span> around it, so MUI's own aria-label
        // landed on the span — a wrapper nothing focuses or reads — and every icon button in the
        // app was nameless to assistive tech and to the e2e suite's getByRole('button', { name }).
        // `label` wins; otherwise a string title is the name; a node title names nothing here.
        aria-label={label ?? (typeof title === 'string' ? title : undefined)}
        sx={updatedSx}
        size={buttonBaseSize}
        onClick={clickHandler}
        type={submit ? 'submit' : undefined}
      >
        <Icon
          {...props}
          name={icon}
          size={size}
          spin={spin}
          color={variant === 'contained' ? undefined : color}
          inlineLeft={iconInlineLeft}
          fixedWidth={fixedWidth}
        />
        {children}
      </MuiIconButton>
    )

    return !(forceTitle && title) && (disabled || !title) ? (
      button
    ) : (
      <Tooltip title={title} placement={placement} arrow className="IconButtonTooltip">
        <span>{button}</span>
      </Tooltip>
    )
  }
)
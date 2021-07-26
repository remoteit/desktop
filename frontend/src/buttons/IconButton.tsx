import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'
import { Color } from '../styling'

type Props = {
  title: string
  icon: string
  disabled?: boolean
  to?: string
  color?: Color
  className?: string
  type?: IconType
  onClick?: (e: React.MouseEvent) => void
}

export const IconButton: React.FC<Props> = ({
  title,
  icon,
  disabled,
  to,
  color,
  type = 'regular',
  className,
  onClick,
  ...props
}) => {
  const history = useHistory()
  const clickHandler = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (to) history.push(to)
  }
  const button = (
    <MuiIconButton
      onClick={clickHandler}
      disabled={disabled}
      className={className}
      style={{ opacity: disabled ? 0.5 : undefined }}
    >
      <Icon {...props} name={icon} color={color} type={type} size="base" />
    </MuiIconButton>
  )

  return disabled ? button : <Tooltip title={title}>{button}</Tooltip>
}

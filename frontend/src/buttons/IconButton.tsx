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
  onClick?: () => void
}

export const IconButton: React.FC<Props> = ({ title, icon, disabled, to, color, className, onClick, ...props }) => {
  const history = useHistory()
  const clickHandler = () => {
    if (onClick) onClick()
    if (to) history.push(to)
  }
  return (
    <Tooltip title={title}>
      <MuiIconButton onClick={clickHandler} disabled={disabled} className={className}>
        <Icon {...props} name={icon} color={color} type="regular" size="base" />
      </MuiIconButton>
    </Tooltip>
  )
}

import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'

type Props = {
  title: string
  icon: string
  disabled?: boolean
  to?: string
  onClick?: () => void
}

export const IconButton: React.FC<Props> = ({ title, icon, disabled, to, onClick, ...props }) => {
  const history = useHistory()
  const clickHandler = () => {
    if (onClick) onClick()
    if (to) history.push(to)
  }
  return (
    <Tooltip title={title}>
      <MuiIconButton onClick={clickHandler} disabled={disabled}>
        <Icon {...props} name={icon} type="regular" size="base" />
      </MuiIconButton>
    </Tooltip>
  )
}

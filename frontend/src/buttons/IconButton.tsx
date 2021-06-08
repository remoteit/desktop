import React from 'react'
import { Tooltip, IconButton as MuiIconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'

type Props = {
  title: string
  icon: string
  disabled?: boolean
  onClick: () => void
}

export const IconButton: React.FC<Props> = ({ title, icon, disabled, onClick, ...props }) => {
  return (
    <Tooltip title={title}>
      <MuiIconButton onClick={() => onClick()} disabled={disabled}>
        <Icon {...props} name={icon} type="regular" size="base" />
      </MuiIconButton>
    </Tooltip>
  )
}

import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Tooltip } from '@mui/material'

export const GlobalTooltip: React.FC = () => {
  const props = useSelector((state: State) => state.ui.globalTooltip)

  if (!props) return null

  const { el, title, color } = props
  return (
    <Tooltip
      open={!!props}
      slotProps={{ tooltip: { sx: { backgroundColor: color, '& .MuiTooltip-arrow': { color } } } }}
      title={title}
      PopperProps={{ anchorEl: el }}
      placement="top"
      arrow
    >
      <span />
    </Tooltip>
  )
}

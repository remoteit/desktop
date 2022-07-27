import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { makeStyles } from '@mui/styles'
import { Tooltip } from '@mui/material'

export const GlobalTooltip: React.FC = () => {
  const props = useSelector((state: ApplicationState) => state.ui.globalTooltip)
  const css = useStyles({ color: props?.color })

  if (!props) return null

  const { el, title } = props
  return (
    <Tooltip
      open={!!props}
      classes={{ tooltip: css.tooltip }}
      title={title}
      PopperProps={{ anchorEl: el }}
      placement="top"
      arrow
    >
      <span className={css.tooltip} />
    </Tooltip>
  )
}

const useStyles = makeStyles({
  tooltip: ({ color }: any) => ({
    backgroundColor: color,
    '& .MuiTooltip-arrow': {
      color,
    },
  }),
})

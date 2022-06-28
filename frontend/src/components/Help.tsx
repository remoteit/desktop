import React from 'react'
import { makeStyles } from '@mui/styles'
import { Tooltip } from '@mui/material'
import { radius, spacing } from '../styling'

type Props = React.HTMLAttributes<HTMLDivElement> & { message: string; children: any }

export const Help: React.FC<Props> = ({ children, message, ...props }) => {
  const css = useStyles()

  return (
    <Tooltip title={message} placement="top" arrow>
      <span {...props} className={css.style}>
        {children}
      </span>
    </Tooltip>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  style: {
    fontWeight: 500,
    backgroundColor: palette.primaryLighter.main,
    borderRadius: radius,
    padding: `0 ${spacing.xs}px 2px`,
  },
}))

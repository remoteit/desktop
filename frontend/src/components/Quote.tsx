import React from 'react'
import { spacing, Sizes } from '../styling'
import { Box } from '@mui/material'

type Props = {
  margin?: Sizes | null
  indent?: 'listItem' | 'checkbox'
  noInset?: boolean
  className?: string
  children?: React.ReactNode
}

export const Quote: React.FC<Props> = ({ margin = 'lg', indent, noInset, className, children }) => {
  let marginLeft: number | undefined
  if (indent === 'listItem') marginLeft = 27
  if (indent === 'checkbox') marginLeft = 14
  return (
    <Box
      className={className}
      sx={theme => ({
        width: `calc(100% - ${marginLeft}px)`,
        position: 'relative',
        marginTop: margin ? `${spacing[margin]}px` : undefined,
        marginBottom: margin ? `${spacing[margin]}px` : undefined,
        paddingLeft: noInset ? undefined : `${spacing.lg}px`,
        borderLeft: `1px solid ${theme.palette.grayLighter.main}`,
        marginLeft: marginLeft !== undefined ? `${marginLeft}px` : undefined,
      })}
    >
      {children}
    </Box>
  )
}

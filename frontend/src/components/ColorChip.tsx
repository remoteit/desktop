import React, { forwardRef } from 'react'
import { Chip, ChipProps, alpha, darken } from '@mui/material'
import { spacing } from '../styling'

export type Props = Omit<ChipProps, 'variant' | 'color'> & {
  color?: Color
  variant?: 'outlined' | 'contained' | 'text'
  inline?: boolean
}

export const ColorChip = forwardRef<HTMLDivElement, Props>(
  ({ variant = 'text', color = 'grayDarker', inline, sx, ...props }, ref) => (
    <Chip
      {...props}
      ref={ref}
      sx={[
        theme => {
          let typeColor: string
          let hoverColor: string
          let backgroundColor: string | undefined

          switch (variant) {
            case 'outlined':
              typeColor = theme.palette[color].main
              hoverColor = alpha(theme.palette[color].main, 0.1)
              break
            case 'contained':
              typeColor = theme.palette.alwaysWhite.main
              backgroundColor = theme.palette[color].main
              hoverColor = darken(theme.palette[color].main, 0.1)
              break
            case 'text':
            default:
              typeColor = theme.palette[color].main
              backgroundColor = alpha(theme.palette[color].main, 0.1)
              hoverColor = alpha(theme.palette[color].main, 0.2)
              break
          }

          return {
            backgroundColor,
            color: typeColor,
            fontWeight: 500,
            letterSpacing: 0.3,
            marginRight: inline ? `${spacing.sm}px` : undefined,
            marginLeft: inline ? `${spacing.sm}px` : undefined,
            '&:hover': { backgroundColor: hoverColor },
          }
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  )
)

import React, { forwardRef } from 'react'
import { makeStyles } from '@mui/styles'
import { Chip, ChipProps, alpha, darken } from '@mui/material'
import { spacing } from '../styling'
import classnames from 'classnames'

export type Props = Omit<ChipProps, 'variant' | 'color'> & {
  color?: Color
  variant?: 'outlined' | 'contained' | 'text'
  inline?: boolean
}

export const ColorChip = forwardRef<HTMLDivElement, Props>(({ variant, color, ...props }, ref) => {
  const css = useStyles({ variant, color, ...props })
  return <Chip {...props} ref={ref} className={classnames(css.color, props.className)} />
})

const useStyles = makeStyles(({ palette }) => ({
  color: ({ variant, color, inline }: Props) => {
    variant ||= 'text'
    color ||= 'grayDarker'

    let typeColor: string
    let hoverColor: string
    let backgroundColor: string | undefined

    switch (variant) {
      case 'outlined':
        typeColor = palette[color].main
        hoverColor = alpha(palette[color].main, 0.1)
        break
      case 'contained':
        typeColor = palette.alwaysWhite.main
        backgroundColor = palette[color].main
        hoverColor = darken(palette[color].main, 0.1)
        break
      case 'text':
      default:
        typeColor = palette[color].main
        backgroundColor = alpha(palette[color].main, 0.1)
        hoverColor = alpha(palette[color].main, 0.2)
        break
    }

    return {
      backgroundColor: backgroundColor,
      color: typeColor,
      fontWeight: 500,
      letterSpacing: 0.3,
      marginRight: inline ? spacing.sm : undefined,
      marginLeft: inline ? spacing.sm : undefined,
      '&:hover': { backgroundColor: hoverColor },
    }
  },
}))

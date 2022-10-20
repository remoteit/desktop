import React from 'react'
import { makeStyles } from '@mui/styles'
import { Chip, ChipProps, alpha } from '@mui/material'
import { Color, spacing } from '../styling'
import classnames from 'classnames'

export type Props = ChipProps & {
  typeColor: Color
  backgroundColor?: Color
  inline?: boolean
}

export const ColorChip: React.FC<Props> = ({ backgroundColor, typeColor, inline, ...props }) => {
  const css = useStyles({ backgroundColor, typeColor, inline })
  return <Chip {...props} className={classnames(css.color, props.className)} />
}

const useStyles = makeStyles(({ palette }) => ({
  color: ({ backgroundColor, typeColor, inline }: Props) => ({
    color: palette[typeColor].main,
    backgroundColor: backgroundColor ? palette[backgroundColor].main : alpha(palette[typeColor].main, 0.1),
    fontWeight: 500,
    letterSpacing: 0.3,
    marginRight: inline ? spacing.sm : undefined,
    marginLeft: inline ? spacing.sm : undefined,
  }),
}))

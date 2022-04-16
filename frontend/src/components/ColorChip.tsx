import React from 'react'
import { makeStyles, Chip, ChipProps, alpha } from '@material-ui/core'
import { Color } from '../styling'
import classnames from 'classnames'

export type Props = ChipProps & {
  typeColor: Color
  backgroundColor?: Color
}

export const ColorChip: React.FC<Props> = ({ backgroundColor, typeColor, ...props }) => {
  const css = useStyles({ backgroundColor, typeColor })
  return <Chip {...props} className={classnames(css.color, props.className)} />
}

const useStyles = makeStyles(({ palette }) => ({
  color: ({ backgroundColor, typeColor }: Props) => ({
    color: palette[typeColor].main,
    backgroundColor: backgroundColor ? palette[backgroundColor].main : alpha(palette[typeColor].main, 0.1),
    fontWeight: 500,
    letterSpacing: 0.3,
  }),
}))

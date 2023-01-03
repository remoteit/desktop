import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { spacing, Color } from '../styling'

export type IndicatorProps = {
  border?: Color
  placement?: 'left' | 'right'
}

export const DiagramIndicator: React.FC<IndicatorProps> = props => {
  const css = useStyles(props)
  return (
    <>
      <span className={classnames(css.indicator, css.border)} />
      <span className={classnames(css.indicator, css.highlight)} />
      <span className={classnames(css.indicator, css.main)} />
    </>
  )
}

const SIZE = 8
const GUTTERS = 10

const useStyles = makeStyles(({ palette }) => ({
  indicator: ({ placement }: IndicatorProps) => ({
    position: 'absolute',
    bottom: -spacing.sm,
    left: placement === 'right' ? undefined : -GUTTERS,
    right: placement === 'right' ? -GUTTERS : undefined,
    transform: `translate(${SIZE * (placement === 'right' ? -2 : 2)}px)`,
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      display: 'block',
      width: '100vw',
      background: 'transparent',
    },
    '&::before': {
      borderRight: `${SIZE}px solid transparent`,
      right: '100%',
    },
    '&::after': { borderLeft: `${SIZE}px solid transparent`, left: 0 },
  }),
  main: {
    '&::before, &::after': { borderTop: `${SIZE}px solid ${palette.white.main}` },
  },
  highlight: {
    '&::before, &::after': { borderTop: `${SIZE}px solid ${palette.grayDarker.main}` },
    '&::before': { transform: `translate(2px)` },
    '&::after': { transform: `translate(-2px)` },
  },
  border: ({ border = 'grayLighter' }: IndicatorProps) => ({
    '&::before, &::after': { borderTop: `${SIZE + 1}px solid ${palette[border].main}` },
    '&::before': { transform: `translate(1px)` },
    '&::after': { transform: `translate(-1px)` },
  }),
}))

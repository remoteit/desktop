import React from 'react'
import { makeStyles } from '@mui/styles'
import { Color } from '../styling'
import { Icon } from './Icon'

export type IndicatorProps = {
  color?: Color
  placement?: 'left' | 'right'
  hide?: boolean
}

export const DiagramIndicator: React.FC<IndicatorProps> = props => {
  const css = useStyles(props)
  if (props.hide) return null

  return (
    <span className={css.icon}>
      <Icon name="arrow-up" fontSize={20} type="regular" color={props.color} fixedWidth />
    </span>
  )
}

const GUTTERS = 24

const useStyles = makeStyles(({ palette, spacing }) => ({
  icon: ({ placement }: IndicatorProps) => ({
    bottom: -30,
    position: 'absolute',
    left: placement === 'right' ? undefined : GUTTERS,
    right: placement === 'right' ? GUTTERS : undefined,
    backgroundColor: palette.white.main,
    padding: spacing(0.5),
    borderBottom: `1px solid ${palette.grayLight.main}`,
    borderRadius: '50%',
  }),
}))

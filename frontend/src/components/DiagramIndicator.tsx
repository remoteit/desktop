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
      <Icon name="arrow-up" fontSize={22} type="solid" color={props.color} />
    </span>
  )
}

const GUTTERS = 32

const useStyles = makeStyles(({ palette }) => ({
  icon: ({ placement }: IndicatorProps) => ({
    bottom: -26,
    position: 'absolute',
    left: placement === 'right' ? undefined : GUTTERS,
    right: placement === 'right' ? GUTTERS : undefined,
    filter: `drop-shadow(3px 2px 1px ${palette.grayLightest.main})`,
  }),
}))

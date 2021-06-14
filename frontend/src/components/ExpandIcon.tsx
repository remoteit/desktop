import React from 'react'
import { Icon } from './Icon'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../styling'

type Props = { open?: boolean }

export const ExpandIcon: React.FC<Props> = ({ open }) => {
  const css = useStyles({ open })
  return <Icon className={css.rotate} color="grayDarker" name="caret-down" type="solid" size="base" fixedWidth />
}

const useStyles = makeStyles({
  rotate: ({ open }: Props) => ({
    marginTop: open ? -spacing.xxs : 0,
    marginLeft: spacing.xs,
    transform: `rotate(${open ? 0 : -90}deg)`,
    transformOrigin: 'center',
    transition: 'transform 300ms, margin-top 300ms',
  }),
})

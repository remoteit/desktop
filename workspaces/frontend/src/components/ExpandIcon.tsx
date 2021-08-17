import React from 'react'
import { Icon } from './Icon'
import { makeStyles } from '@material-ui/core'
import { spacing } from '../styling'

type Props = { open?: boolean }

export const ExpandIcon: React.FC<Props> = ({ open }) => {
  const css = useStyles({ open })
  return <Icon className={css.rotate} color="grayDarker" name="caret-down" type="solid" size="sm" fixedWidth />
}

const useStyles = makeStyles({
  rotate: ({ open }: Props) => ({
    marginLeft: spacing.sm,
    transform: `rotate(${open ? 0 : -90}deg)`,
    transformOrigin: 'center',
    transition: 'transform 300ms, margin-bottom 300ms',
  }),
})

import React from 'react'
import { Icon, IconProps } from './Icon'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

type Props = IconProps & { open?: boolean }

export const ExpandIcon: React.FC<Props> = ({ open, ...props }) => {
  const css = useStyles()
  return (
    <Icon
      className={css.icon}
      rotate={open ? 0 : -90}
      color="grayDarker"
      name="caret-down"
      type="solid"
      size="sm"
      fixedWidth
      {...props}
    />
  )
}

const useStyles = makeStyles({
  icon: {
    marginLeft: spacing.sm,
    transformOrigin: 'center',
    transition: 'transform 300ms, margin-bottom 300ms',
  },
})

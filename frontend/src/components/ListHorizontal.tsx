import React from 'react'
import classnames from 'classnames'
import { List, ListProps } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

type Props = ListProps & {
  size?: 'large' | 'small'
  hideIcons?: boolean
}

export const ListHorizontal: React.FC<Props> = ({ size = 'large', hideIcons, children, ...props }) => {
  const css = useStyles({ hideIcons, small: size === 'small' })
  return (
    <List {...props} className={classnames(css.horizontal, props.className)}>
      {children}
    </List>
  )
}

const useStyles = makeStyles({
  horizontal: ({ mobile, small }: any) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItemIcon-root': {
      justifyContent: 'flex-start',
    },
    '& .MuiListItem-root': {
      display: small ? undefined : 'block',
      minWidth: 100,
      width: 100,
      paddingLeft: small ? undefined : spacing.md,
      paddingTop: small ? undefined : spacing.lg,
      paddingBottom: small ? undefined : spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
  }),
  small: {
    '& .MuiListItemIcon-root': { minWidth: 100 },
  },
})

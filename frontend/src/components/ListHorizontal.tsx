import React from 'react'
import classnames from 'classnames'
import { List, ListProps, useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

type Props = ListProps & {
  size?: 'large' | 'small'
  hideIcons?: boolean
}

export const ListHorizontal: React.FC<Props> = ({ size = 'large', hideIcons, children, ...props }) => {
  const smallScreen = useMediaQuery(`(max-width:500px)`)
  const css = useStyles({ hideIcons, smallScreen, small: size === 'small' })
  return (
    <List {...props} className={classnames(css.horizontal, props.className)}>
      {children}
    </List>
  )
}

const useStyles = makeStyles({
  horizontal: ({ smallScreen, small }: any) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: small ? undefined : 'block',
      minWidth: smallScreen ? undefined : 100,
      width: 'initial',
      paddingLeft: small ? undefined : spacing.md,
      paddingTop: small ? undefined : spacing.lg,
      paddingBottom: small ? undefined : spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemText-root': { display: smallScreen ? 'none' : undefined },
    '& .MuiListItemIcon-root': { minWidth: small ? 44 : 'initial' },
    '& .MuiListSubheader-root': { width: '100%' },
    '& .MuiDivider-root': { width: '100%' },
  }),
  small: {
    '& .MuiListItemIcon-root': { minWidth: 100 },
  },
})

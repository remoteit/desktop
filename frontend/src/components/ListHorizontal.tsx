import React from 'react'
import classnames from 'classnames'
import { List, ListProps, useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

export const ListHorizontal: React.FC<ListProps> = ({ children, ...props }) => {
  const hideIcons = useMediaQuery(`(max-width:500px)`)
  const css = useStyles({ hideIcons })
  return (
    <List {...props} className={classnames(css.horizontal, props.className)}>
      {children}
    </List>
  )
}

const useStyles = makeStyles({
  horizontal: ({ hideIcons }: any) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: 'block',
      minWidth: hideIcons ? undefined : 100,
      width: 'initial',
      paddingLeft: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemText-root': { display: hideIcons ? 'none' : undefined },
    '& .MuiListItemIcon-root': { minWidth: 'initial' },
    '& .MuiListSubheader-root': { width: '100%' },
    '& .MuiDivider-root': { width: '100%' },
  }),
})

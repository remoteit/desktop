import React from 'react'
import classnames from 'classnames'
import { List, ListProps } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

export const ListHorizontal: React.FC<ListProps> = ({ children, ...props }) => {
  const css = useStyles()
  return (
    <List {...props} className={classnames(css.horizontal, props.className)}>
      {children}
    </List>
  )
}

const useStyles = makeStyles({
  horizontal: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: 'block',
      minWidth: 100,
      width: 'initial',
      paddingLeft: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemIcon-root': { minWidth: 'initial' },
    '& .MuiListSubheader-root': { width: '100%' },
    '& .MuiDivider-root': { width: '100%' },
  },
})

import React from 'react'
import { makeStyles, List } from '@material-ui/core'
import { spacing } from '../styling'

export const ListHorizontal: React.FC = ({ children, ...props }) => {
  const css = useStyles()
  return (
    <List {...props} className={css.horizontal} dense>
      {children}
    </List>
  )
}

const useStyles = makeStyles({
  horizontal: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    paddingRight: spacing.lg,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: 'block',
      width: 100,
      paddingLeft: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      paddingRight: spacing.xs,
      margin: 1,
    },
    '& .MuiListItemIcon-root': { minWidth: 'initial' },
    // '& .MuiListItem-root + .MuiListItem-root': { borderLeft: `1px solid ${colors.grayLighter}` },
  },
})

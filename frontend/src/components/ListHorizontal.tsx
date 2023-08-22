import React from 'react'
import classnames from 'classnames'
import { MOBILE_WIDTH } from '../shared/constants'
import { List, ListProps, useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'

type Props = ListProps & {
  size?: 'large' | 'small'
  hideIcons?: boolean
}

export const ListHorizontal: React.FC<Props> = ({ size = 'large', hideIcons, children, ...props }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const css = useStyles({ hideIcons, mobile, small: size === 'small' })
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
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItem-root': {
      display: small ? undefined : 'block',
      minWidth: mobile ? undefined : 100,
      width: 'initial',
      paddingLeft: small ? undefined : spacing.md,
      paddingTop: small ? undefined : spacing.lg,
      paddingBottom: small ? undefined : spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemText-root': { display: mobile ? 'none' : undefined },
    '& .MuiListItemIcon-root': { minWidth: small ? 44 : 'initial' },
    '& .MuiListSubheader-root': { width: '100%' },
    '& .MuiDivider-root': { width: '100%' },
  }),
  small: {
    '& .MuiListItemIcon-root': { minWidth: 100 },
  },
})

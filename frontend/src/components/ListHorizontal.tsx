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
    marginTop: spacing.md,
    paddingRight: spacing.xs,
    paddingLeft: spacing.md,
    '& .MuiListItemIcon-root': {
      justifyContent: 'flex-start',
    },
    '& .MuiListItem-root': {
      display: small ? undefined : 'block',
      minWidth: mobile ? undefined : 120,
      width: mobile ? 90 : 100,
      paddingLeft: small ? undefined : spacing.md,
      paddingTop: small ? undefined : spacing.lg,
      paddingBottom: small ? undefined : spacing.sm,
      paddingRight: spacing.md,
      margin: 1,
    },
    '& .MuiListItemText-root > .MuiTypography-root': {
      fontSize: mobile ? '12px' : undefined,
    },
  }),
})

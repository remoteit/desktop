import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { List, ListProps, useMediaQuery } from '@mui/material'
import { spacing } from '../styling'

type Props = ListProps & {
  size?: 'large' | 'small'
  hideIcons?: boolean
}

export const ListHorizontal: React.FC<Props> = ({ size = 'large', hideIcons, children, ...props }) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const small = size === 'small'
  return (
    <List
      {...props}
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        marginTop: `${spacing.md}px`,
        paddingRight: `${spacing.xs}px`,
        paddingLeft: `${spacing.md}px`,
        '& .MuiListItemIcon-root': {
          justifyContent: 'flex-start',
        },
        '& .MuiListItemButton-root': {
          display: small ? undefined : 'block',
          minWidth: mobile ? undefined : 100,
          width: mobile ? 90 : 100,
          paddingLeft: small ? undefined : `${spacing.md}px`,
          paddingTop: small ? undefined : `${spacing.lg}px`,
          paddingBottom: small ? undefined : `${spacing.sm}px`,
          paddingRight: `${spacing.md}px`,
          flexGrow: 'initial',
          margin: '1px',
        },
        '& .MuiListItemText-root > .MuiTypography-root': {
          fontSize: mobile ? '12px' : undefined,
        },
      }}
    >
      {children}
    </List>
  )
}

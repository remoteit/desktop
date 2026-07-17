import React from 'react'
import { radius, spacing } from '../styling'
import { Box, ListItemIcon, ListItemButton, ListItemButtonProps } from '@mui/material'

type Props = ListItemButtonProps & {
  data?: any
  icon?: React.ReactNode
  required?: React.ReactNode
  mobile?: boolean
  stickyCenter?: boolean
}

export const GridListItem: React.FC<Props> = ({ required, icon, mobile, stickyCenter, children, sx, ...props }) => {
  const hasSticky = !!(icon || required)

  return (
    <ListItemButton
      sx={[
        theme => ({
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          width: '100%',
          '&:hover': {
            backgroundColor: theme.palette.primaryHighlight.main,
          },
          '&:hover > div:first-of-type, &.Mui-selected > div:first-of-type': {
            backgroundImage: `linear-gradient(90deg, ${theme.palette.primaryHighlight.main} 95%, transparent)`,
          },
          '&.Mui-selected:hover > div:first-of-type': {
            backgroundImage: `linear-gradient(90deg, ${theme.palette.primaryLighter.main} 95%, transparent)`,
          },
          '& > div:first-of-type > div': {
            width: '100%',
          },
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {hasSticky && (
        <Box
          sx={[
            theme => ({
              position: 'sticky',
              left: 0,
              zIndex: 4,
              display: 'flex',
              alignItems: 'start !important',
              borderTopRightRadius: radius.lg,
              borderBottomRightRadius: radius.lg,
              backgroundImage: `linear-gradient(90deg, ${theme.palette.white.main} 95%, transparent)`,
              overflow: 'visible',
              paddingLeft: `${spacing.md}px`,
              height: '100%',
            }),
            stickyCenter ? { justifyContent: 'center', paddingLeft: 0 } : {},
          ]}
        >
          <Box sx={stickyCenter ? { justifyContent: 'center', width: 'auto !important' } : undefined}>
            {icon && <ListItemIcon sx={stickyCenter ? { minWidth: 'auto' } : undefined}>{icon}</ListItemIcon>}
            {!stickyCenter && required}
          </Box>
        </Box>
      )}
      {!mobile && children}
    </ListItemButton>
  )
}

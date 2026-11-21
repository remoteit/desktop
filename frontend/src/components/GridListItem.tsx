import React from 'react'
import { spacing, toSxArray } from '../styling'
import { Box, ListItemIcon, ListItemButton, ListItemButtonProps } from '@mui/material'

type Props = ListItemButtonProps & {
  data?: any
  icon?: React.ReactNode
  required?: React.ReactNode
  mobile?: boolean
  stickyCenter?: boolean
}

export const GridListItem: React.FC<Props> = ({ required, icon, mobile, stickyCenter, children, sx, ...props }) => {
  // A null value leaves a blank cell in the required column of a grouped row.
  const hasSticky = !!icon || required !== undefined

  return (
    <ListItemButton
      sx={[
        theme => ({
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          width: '100%',
          backgroundColor: theme.palette.white.main,
          '&:hover, &.Mui-focusVisible, &.Mui-selected, &.Mui-selected.Mui-focusVisible': {
            backgroundColor: theme.palette.primaryHighlight.main,
          },
          '&.Mui-selected:hover': {
            backgroundColor: theme.palette.primaryLighter.main,
          },
          '& > div:first-of-type > div': {
            width: '100%',
          },
        }),
        ...toSxArray(sx),
      ]}
      {...props}
    >
      {hasSticky && (
        <Box
          className="GridList-pinned"
          sx={[
            {
              position: 'sticky',
              left: 0,
              zIndex: 4,
              display: 'flex',
              alignItems: 'start !important',
              backgroundColor: 'inherit',
              overflow: 'visible',
              paddingLeft: `${spacing.md}px`,
              height: '100%',
            },
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

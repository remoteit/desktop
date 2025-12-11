import React from 'react'
import { makeStyles } from '@mui/styles'
import { radius, spacing } from '../styling'
import { Box, ListItemIcon, ListItemButton, ListItemButtonProps } from '@mui/material'

type Props = ListItemButtonProps & {
  data?: any
  icon?: React.ReactNode
  required?: React.ReactNode
  mobile?: boolean
}

export const GridListItem: React.FC<Props> = ({ required, icon, mobile, children, ...props }) => {
  const css = useStyles()

  return (
    <ListItemButton className={css.row} {...props}>
      <Box className={css.sticky}>
        <Box>
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          {required}
        </Box>
      </Box>
      {!mobile && children}
    </ListItemButton>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  row: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    width: '100%',
    '&:hover': {
      backgroundColor: palette.primaryHighlight.main,
    },
    '&:hover > div:first-of-type, &.Mui-selected > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected:hover > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryLighter.main} 95%, transparent)`,
    },
    '& > div:first-of-type > div': {
      width: '100%',
    },
  },
  sticky: {
    position: 'sticky',
    left: 0,
    zIndex: 4,
    display: 'flex',
    alignItems: 'start !important',
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundImage: `linear-gradient(90deg, ${palette.white.main} 95%, transparent)`,
    overflow: 'visible',
    paddingLeft: spacing.md,
    height: '100%',
  },
}))

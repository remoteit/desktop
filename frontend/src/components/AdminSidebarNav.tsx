import React from 'react'
import { makeStyles } from '@mui/styles'
import { List } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { spacing } from '../styling'

export const AdminSidebarNav: React.FC = () => {
  const css = useStyles()

  return (
    <List className={css.list}>
      <ListItemLocation title="Users" icon="users" to="/admin/users" match="/admin/users" dense />
      <ListItemLocation title="Partners" icon="handshake" to="/admin/partners" match="/admin/partners" dense />
    </List>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    position: 'static',
    '& .MuiListItemIcon-root': { color: palette.grayDark.main },
    '& .MuiListItemText-primary': { color: palette.grayDarkest.main },
    '& .MuiListItemButton-root:hover .MuiListItemText-primary': { color: palette.black.main },
    '& .Mui-selected, & .Mui-selected:hover': {
      backgroundColor: palette.primaryLighter.main,
      '& .MuiListItemIcon-root': { color: palette.grayDarker.main },
      '& .MuiListItemText-primary': { color: palette.black.main, fontWeight: 500 },
    },
  },
}))


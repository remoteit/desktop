import React from 'react'
import { List } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'

export const AdminSidebarNav: React.FC = () => {
  return (
    <List
      sx={{
        position: 'static',
        '& .MuiListItemIcon-root': { 
          color: 'grayDark.main' 
        },
        '& .MuiListItemText-primary': { 
          color: 'grayDarkest.main' 
        },
        '& .MuiListItemButton-root:hover .MuiListItemText-primary': { 
          color: 'black.main' 
        },
        '& .Mui-selected, & .Mui-selected:hover': {
          backgroundColor: 'primaryLighter.main',
          '& .MuiListItemIcon-root': { 
            color: 'grayDarker.main' 
          },
          '& .MuiListItemText-primary': { 
            color: 'black.main', 
            fontWeight: 500 
          },
        },
      }}
    >
      <ListItemLocation title="Users" icon="users" to="/admin/users" match="/admin/users" dense />
      <ListItemLocation title="Partners" icon="handshake" to="/admin/partners" match="/admin/partners" dense />
    </List>
  )
}


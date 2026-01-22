import React from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'
import { State } from '../store'

export const AdminSidebarNav: React.FC = () => {
  const history = useHistory()
  const defaultSelection = useSelector((state: State) => state.ui.defaultSelection)
  const currentPath = history.location.pathname

  const handleNavClick = (baseRoute: string) => {
    const adminSelection = defaultSelection['admin']
    const savedRoute = adminSelection?.[baseRoute]
    history.push(savedRoute || baseRoute)
  }

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
      <ListItemButton
        dense
        selected={currentPath.includes('/admin/users')}
        onClick={() => handleNavClick('/admin/users')}
      >
        <ListItemIcon>
          <Icon name="users" size="md" />
        </ListItemIcon>
        <ListItemText primary="Users" />
      </ListItemButton>
      
      <ListItemButton
        dense
        selected={currentPath.includes('/admin/partners')}
        onClick={() => handleNavClick('/admin/partners')}
      >
        <ListItemIcon>
          <Icon name="handshake" size="md" />
        </ListItemIcon>
        <ListItemText primary="Partners" />
      </ListItemButton>
    </List>
  )
}


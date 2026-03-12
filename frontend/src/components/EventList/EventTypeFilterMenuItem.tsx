import React from 'react'
import { Box, ListItemIcon, ListItemText, MenuItem } from '@mui/material'
import { Icon } from '../Icon'

type Props = {
  label: string
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
}

export const EventTypeFilterMenuItem: React.FC<Props> = ({ label, selected, onClick, icon }) => (
  <MenuItem dense selected={selected} onClick={onClick}>
    <Box sx={{ width: 18, display: 'flex', justifyContent: 'flex-end' }}>
      {selected && <Icon name="check" color="primary" />}
    </Box>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={label} />
  </MenuItem>
)

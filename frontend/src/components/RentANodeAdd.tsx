import React from 'react'
import { List, ListItemButton, ListItemText, ListSubheader, ListItemIcon } from '@mui/material'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { className?: string }

export const RentANodeAdd: React.FC<Props> = ({ className }) => {
  return (
    <List className={className} dense disablePadding>
      <ListSubheader disableGutters>Rent-A-Node</ListSubheader>
      <ListItemButton disableGutters component={Link} to="/add/cachengo">
        <ListItemIcon>
          <Icon name="cachengo" size="xxl" platformIcon fixedWidth />
        </ListItemIcon>
        <ListItemText primary="Cachengo Node" secondary="Rent a Symbiote from our distributed cloud" />
      </ListItemButton>
    </List>
  )
}

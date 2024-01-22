import React from 'react'
import { useHistory } from 'react-router-dom'
import { List, ListItem, ListItemText, ListSubheader, ListItemIcon, Divider, Typography } from '@mui/material'
import { MobileUI } from '../components/MobileUI'
import { Icon } from '../components/Icon'

type Props = { className?: string; onClick?: () => void }

export const ScreenViewSetup: React.FC<Props> = ({ className, onClick }) => {
  const history = useHistory()

  const handleClick = () => history.push('/add/screenview')

  return (
    <MobileUI ios hide>
      <List className={className} dense disablePadding>
        <ListSubheader disableGutters>Remote Control</ListSubheader>
        <Divider />
        <ListItem button disableGutters onClick={handleClick}>
          <ListItemIcon>
            <Icon name="screenview" size="xxl" platformIcon />
          </ListItemIcon>
          <ListItemText primary="Remote.It ScreenView" secondary="Share and control a remote Android's screen" />
        </ListItem>
      </List>
    </MobileUI>
  )
}

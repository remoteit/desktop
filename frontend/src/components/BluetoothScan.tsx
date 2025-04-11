import React from 'react'
import { List, ListItemButton, ListItemText, ListSubheader, ListItemIcon } from '@mui/material'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

type Props = { className?: string }

export const BluetoothScan: React.FC<Props> = ({ className }) => {
  return (
    <List className={className} dense disablePadding>
      <ListSubheader disableGutters>Onboard</ListSubheader>
      <ListItemButton disableGutters component={Link} to="/onboard/raspberrypi">
        <ListItemIcon
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', '& > *': { marginRight: 0.5 } }}
        >
          <Icon name="bluetooth" size="xxl" color="calm" />
        </ListItemIcon>
        <ListItemText
          primary="Setup WiFi"
          secondary={
            <>
              Connect your Pi to Wifi
              <br /> and Remote.It
            </>
          }
        />
      </ListItemButton>
    </List>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { List, ListItemButton, ListItemText, ListSubheader, ListItemIcon, Divider } from '@mui/material'
import { MobileUI } from '../components/MobileUI'
import { Icon } from '../components/Icon'

type Props = { className?: string }

export const BluetoothScan: React.FC<Props> = ({ className }) => {
  return (
    <MobileUI>
      <List className={className} dense disablePadding>
        <ListSubheader disableGutters>Onboard</ListSubheader>
        <Divider />
        <ListItemButton disableGutters component={Link} to="/onboard/raspberrypi">
          <ListItemIcon
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', '& > *': { marginRight: 0.5 } }}
          >
            <Icon name="mobile-signal-out" type="light" fontSize={30} color="gray" />
            <Icon name="plus" type="solid" color="gray" fixedWidth />
            <Icon name="raspberrypi" fixedWidth fontSize={40} color="primary" platform={1072} platformIcon />
            {/* <Icon name="wifi" type="solid" fontSize={14} color="gray" /> */}
          </ListItemIcon>
          <ListItemText
            primary="Setup RaspberryPi"
            secondary={
              <>
                Connect your Remote.It
                <br /> Pi to Wifi
              </>
            }
          />
        </ListItemButton>
      </List>
    </MobileUI>
  )
}

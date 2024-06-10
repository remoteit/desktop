import React from 'react'
import { List, ListItemButton, ListItemText, ListSubheader, ListItemIcon, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

type Props = { className?: string }

export const BluetoothScan: React.FC<Props> = ({ className }) => {
  return (
    <List className={className} dense disablePadding>
      <ListSubheader disableGutters>Onboard</ListSubheader>
      <Divider />
      <ListItemButton disableGutters component={Link} to="/onboard/raspberrypi">
        <ListItemIcon
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', '& > *': { marginRight: 0.5 } }}
        >
          <Icon name="bluetooth" type="regular" fontSize={32} color="primary" />
          {/* <Icon name="bluetooth" type="light" size="md" color="grayDarker" fixedWidth /> */}
          {/* <Icon name="linux" fixedWidth fontSize={40} color="primary" platformIcon /> */}
          {/* <Icon name="wifi" type="solid" fontSize={14} color="gray" /> */}
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              Setup WiFi &nbsp;
              {/* <Icon name="raspberrypi" size="base" color="primary" platformIcon /> */}
            </>
          }
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

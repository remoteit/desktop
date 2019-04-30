import React from 'react'
import { DeviceStateIcon } from '../DeviceStateIcon'
import { ServiceController } from '../../controllers/ServiceController'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import {
  ListItem,
  Tooltip,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  List,
  Divider,
  Button,
} from '@material-ui/core'

export interface Props {
  device: IDevice
  startOpen?: boolean
}

export function DeviceListItem({ device, startOpen = false, ...props }: Props) {
  const [open, setOpen] = React.useState(startOpen)

  function handleClick() {
    setOpen(!open)
  }

  // className="df ai-center px-md py-sm bb bc-gray-lighter bg-white hov-bg-gray-lightest c-pointer"
  return (
    <>
      <ListItem {...props} onClick={handleClick} button>
        <ListItemIcon>
          <Tooltip title={device.state}>
            <DeviceStateIcon state={device.state} size="lg" className="pl-sm" />
          </Tooltip>
        </ListItemIcon>
        <ListItemText inset primary={device.name} />
        <ListItemSecondaryAction>
          {open ? (
            <Icon name="chevron-up" color="gray" className="pr-md" />
          ) : (
            <Icon name="chevron-down" color="gray" className="pr-md" />
          )}
        </ListItemSecondaryAction>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="nav" disablePadding>
          {device.services.map((service, key) => (
            <ServiceController service={service} key={key} />
          ))}
        </List>
      </Collapse>
      <Divider />
    </>
  )
}

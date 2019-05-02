import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
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
} from '@material-ui/core'
import { ServiceList } from '../ServiceList'

export interface DeviceListItemProps {
  device: IDevice
  startOpen?: boolean
}

export function DeviceListItem({
  device,
  startOpen = false,
  ...props
}: DeviceListItemProps) {
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
            <ConnectionStateIcon
              state={device.state}
              size="lg"
              className="pl-sm"
            />
          </Tooltip>
        </ListItemIcon>
        <ListItemText inset primary={device.name} />
        <div className="ml-auto">
          {open ? (
            <Icon name="chevron-up" color="gray" className="pr-sm" />
          ) : (
            <Icon name="chevron-down" color="gray" className="pr-sm" />
          )}
        </div>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <ServiceList services={device.services} />
      </Collapse>
      <Divider />
    </>
  )
}

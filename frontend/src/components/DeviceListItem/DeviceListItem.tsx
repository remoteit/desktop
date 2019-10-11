import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import { ListItem, ListItemIcon, ListItemText, Collapse, Divider } from '@material-ui/core'
import { ServiceList } from '../ServiceList'

export interface DeviceListItemProps {
  device: IDevice
  startOpen?: boolean
}

export function DeviceListItem({ device, startOpen = false, ...props }: DeviceListItemProps) {
  const [open, setOpen] = React.useState(startOpen)

  function handleClick() {
    setOpen(!open)
  }

  return (
    <div className="bg-white">
      <ListItem {...props} onClick={handleClick} button>
        <ListItemIcon>
          <ConnectionStateIcon state={device.state} size="lg" className="ml-sm" />
        </ListItemIcon>
        <ListItemText primary={device.name} />
        <div className="ml-auto">
          {open ? (
            <Icon name="chevron-up" color="gray" className="pr-sm" />
          ) : (
            <Icon name="chevron-down" color="gray" className="pr-sm" />
          )}
        </div>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div className="bg-gray-lightest pb-sm pt-none px-sm">
          <div className="bg-white ba bc-gray-light rad-sm">
            <ServiceList services={device.services} />
          </div>
        </div>
      </Collapse>
      <Divider />
    </div>
  )
}

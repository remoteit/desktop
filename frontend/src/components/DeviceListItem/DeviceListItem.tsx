import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@material-ui/core'
import { ServiceList } from '../ServiceList'
import styles from './DeviceListItem.module.css'

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
      <ListItem
        {...props}
        className={styles.listItem}
        onClick={handleClick}
        button
      >
        <ListItemIcon>
          <ConnectionStateIcon
            state={device.state}
            size="lg"
            className="pl-sm"
          />
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
        <div className="bg-gray-lighter p-md">
          <div className="bg-white ba bc-gray-light rad-sm">
            <ServiceList services={device.services} />
          </div>
        </div>
      </Collapse>
      <Divider />
    </>
  )
}

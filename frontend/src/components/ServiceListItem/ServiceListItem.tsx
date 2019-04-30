import React from 'react'
import {
  ListItem,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Button,
} from '@material-ui/core'
import { Icon } from '../Icon'
import { DeviceStateIcon } from '../DeviceStateIcon'
import { IService } from 'remote.it'

export interface Props {
  connect: (service: IService) => void
  service: IService
}

export function ServiceListItem({ connect, service }: Props) {
  return (
    <ListItem button>
      <ListItemIcon>
        <Tooltip title={service.state}>
          <DeviceStateIcon state={service.state} size="lg" className="pl-sm" />
        </Tooltip>
      </ListItemIcon>
      <ListItemText
        inset
        primary={service.name}
        secondary={
          service.name.toLowerCase() === service.type.toLowerCase()
            ? null
            : service.type
        }
      />
      {service.state === 'active' && (
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => connect(service)}
        >
          <Icon name="plug" className="mr-sm" />
          Connect
        </Button>
      )}
      {service.state === 'connected' && (
        <Button variant="outlined" size="small" color="primary">
          <Icon name="rocket" className="mr-sm" />
          Launch
        </Button>
      )}
    </ListItem>
  )
}

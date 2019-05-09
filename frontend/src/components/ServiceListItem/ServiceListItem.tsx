import React from 'react'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { CopyableText } from '../CopyableText'
import { ConnectButtonController } from '../../controllers/ConnectButtonController'
import { IService } from 'remote.it'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController/DisconnectButtonController'

export interface ServiceListItemProps {
  service: IService
}

export function ServiceListItem({ service }: ServiceListItemProps) {
  return (
    <ListItem button className="bb bc-gray-lighter py-xs">
      <ListItemIcon>
        <ConnectionStateIcon
          state={service.state}
          size="lg"
          className="pl-sm"
        />
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
      {service.port && (
        <CopyableText value={`localhost:${service.port}`} className="txt-md" />
      )}
      {service.state === 'connected' && (
        <>
          {/*}
          <Tooltip title="Launch">
            <IconButton color="primary">
              <Icon name="rocket" fixedWidth />
            </IconButton>
          </Tooltip>
          */}
          <DisconnectButtonController service={service} />
        </>
      )}
      {service.state === 'active' && (
        <ConnectButtonController service={service} />
      )}
    </ListItem>
  )
}

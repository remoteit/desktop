import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Tooltip, IconButton } from '@material-ui/core'
import { IService } from 'remote.it'
import { connect } from 'react-redux'
import { Icon } from '../Icon'

const mapDispatch = (dispatch: any) => ({
  connect: dispatch.devices.connect,
})

export type ServiceListItemProps = ReturnType<typeof mapDispatch> & {
  service: IService
}

export const ServiceListItem = connect(
  null,
  mapDispatch
)(({ connect, service }: ServiceListItemProps) => {
  return (
    <ListItem>
      <ListItemIcon>
        <ConnectionStateIcon state={service.connecting ? 'connecting' : service.state} size="lg" />
      </ListItemIcon>
      <ListItemText primary={service.name} />
      <ListItemSecondaryAction>
        <Tooltip title="Connect">
          <IconButton disabled={service.connecting} onClick={() => connect(service.id)}>
            <Icon name="arrow-right" color="primary" size="md" weight="regular" fixedWidth />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  )
})

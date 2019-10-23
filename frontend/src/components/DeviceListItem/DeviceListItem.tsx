import React from 'react'
import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Collapse, Divider } from '@material-ui/core'
import { ServiceList } from '../ServiceList'

const mapState = (state: ApplicationState) => ({
  connections: state.devices.connections.reduce((result: ConnectionLookup, c: ConnectionInfo) => {
    result[c.id] = c
    return result
  }, {}),
})

export type DeviceListItemProps = ReturnType<typeof mapState> & {
  device: IDevice
  key?: string
}

export const DeviceListItem = connect(
  mapState,
  null
)(({ device, connections, key }: DeviceListItemProps) => {
  function handleClick() {
    console.log('click')
  }

  return (
    <>
      <ListItem key={key} onClick={handleClick} button>
        <ListItemIcon>
          <ConnectionStateIcon state={device.state} size="lg" />
        </ListItemIcon>
        <ListItemText primary={device.name} />
        <ListItemSecondaryAction>
          <Icon name="chevron-right" />
        </ListItemSecondaryAction>
      </ListItem>
      <Collapse in={true} timeout="auto" unmountOnExit>
        <ServiceList services={device.services} connections={connections} />
      </Collapse>
    </>
  )
})

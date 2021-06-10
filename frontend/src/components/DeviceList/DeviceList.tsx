import React from 'react'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListItem } from '../DeviceListItem'
import { Attribute } from '../../helpers/attributes'
import { isOffline } from '../../models/devices'
import { LoadMore } from '../LoadMore'
import { List } from '@material-ui/core'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  attributes: Attribute[]
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  myDevice?: IDevice
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  attributes,
  restore,
  select,
  myDevice,
}) => {
  return (
    <>
      <List>
        {devices?.map(device => {
          const canRestore = isOffline(device) && !device.shared
          if (restore && !canRestore) return
          return (
            <DeviceListItem
              key={device.id}
              device={device}
              connections={connections[device.id]}
              attributes={attributes}
              thisDevice={device.id === myDevice?.id}
              restore={restore && canRestore}
              select={select}
            />
          )
        })}
      </List>
      <LoadMore />
      <ServiceContextualMenu />
    </>
  )
}

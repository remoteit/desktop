import React from 'react'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListItem } from '../DeviceListItem'
import { Attribute } from '../../helpers/attributes'
import { isOffline } from '../../models/devices'
import { GuideStep } from '../GuideStep'
import { LoadMore } from '../LoadMore'
import { List } from '@material-ui/core'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  attributes: Attribute[]
  primary?: Attribute
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  attributes,
  primary,
  restore,
  select,
}) => {
  return (
    <>
      <List>
        <GuideStep
          guide="guideAWS"
          step={3}
          placement="bottom"
          instructions="Click on the AWS Demo device to continue."
          highlight
          autoNext
        >
          {devices?.map(device => {
            const canRestore = isOffline(device) && !device.shared
            if (restore && !canRestore) return
            return (
              <DeviceListItem
                key={device.id}
                device={device}
                connections={connections[device.id]}
                primary={primary}
                attributes={attributes}
                restore={restore && canRestore}
                select={select}
              />
            )
          })}
        </GuideStep>
      </List>
      <LoadMore />
      <ServiceContextualMenu />
    </>
  )
}

import React from 'react'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { EventHeader } from '../../components/EventList/EventHeader'
import { EventList } from '../../components/EventList'

export const DeviceLogPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  if (!device) return null

  return (
    <DeviceHeaderMenu device={device} header={<EventHeader device={device} />}>
      <EventList device={device} />
    </DeviceHeaderMenu>
  )
}

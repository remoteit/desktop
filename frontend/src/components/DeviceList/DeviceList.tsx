import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { List } from '@material-ui/core'
import classnames from 'classnames'
import { LoadingMessage } from '../LoadingMessage'
import { Icon } from '../Icon'

export interface DeviceListProps {
  className?: string
  devices?: IDevice[]
  searchOnly: boolean
  searching: boolean
  query: string
}

export function DeviceList({
  className = '',
  devices = [],
  searchOnly = false,
  query = '',
  searching = false,
}: DeviceListProps & React.HTMLProps<HTMLDivElement>) {
  if (searching) {
    return (
      <div className="px-md py-sm center gray italic">
        <Icon name="spinner-third" spin className="mr-sm" /> Searching...
      </div>
    )
  }

  if (!devices || !devices.length) {
    if (searchOnly) {
      if (query) {
        return (
          <div className="px-md py-sm center bg-warning white fw-bold">
            Your search didn't match any results, please try a different search.
          </div>
        )
      } else {
        return (
          <div className="px-md py-sm center gray italic">
            Please search for a device or service above.
          </div>
        )
      }
    }

    return (
      <div className="px-md py-sm center bg-warning white fw-bold">
        You have no devices, please a device to your account and you will see it
        here.
      </div>
    )
  }

  const sortedDevices = sortDevices(devices)

  return (
    <List component="nav" className={classnames(className, 'py-none')}>
      {sortedDevices.map(device => (
        <DeviceListItem key={device.id} device={device} />
      ))}
    </List>
  )
}

function sortDevices(devices: IDevice[]) {
  return devices.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  )
}

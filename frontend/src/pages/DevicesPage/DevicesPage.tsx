import React, { useState, useEffect } from 'react'
import { DeviceList } from '../../components/DeviceList'
import { IDevice, DeviceState, IService } from 'remote.it'
import { StateTabs } from '../../components/StateTabs'
import { useTitle } from 'hookrouter'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { ServiceList } from '../../components/ServiceList'
import { Page } from '../Page'
import { PageHeading } from '../../components/PageHeading'

export function DevicesPage({
  devices,
  fetch,
  fetching,
  getConnections,
}: Props) {
  const [tab, setTab] = useState<DeviceState>('active')

  useTitle('Devices') // TODO: Translate

  useEffect(() => {
    fetch().then(() => getConnections())
  }, [])

  // If we are loading the user's devices, we should show
  // them a nice loading indicator while we get their devices.
  // TODO: only show this if there are no devices
  if (fetching) {
    return <DeviceLoadingMessage />
  }

  // If the user has no devices associated with their account,
  // we should show them a friendly message.
  if (!devices || !devices.length) {
    return <NoDevicesMessage />
  }

  const visibleDevices = sortDevices(tab, devices)

  return (
    <Page>
      <PageHeading>Devices</PageHeading>
      {/*<FormControl className="ml-auto" style={{ minWidth: '300px' }}>
            <Input
              id="input-with-icon-adornment"
              startAdornment={
                <InputAdornment position="start">
                  <Icon name="search" />
                </InputAdornment>
              }
              placeholder="Search devices and services..."
            />
            </FormControl>*/}
      <div className="bg-white bs-2 mb-xl">
        <StateTabs
          state={tab}
          handleChange={(state: DeviceState) => setTab(state)}
        />
        {tab === 'connected' ? (
          <ServiceList
            services={visibleDevices.reduce(
              (all, d) => {
                const services = d.services.filter(s => s.state === 'connected')
                return [...all, ...services]
              },
              [] as IService[]
            )}
          />
        ) : (
          <DeviceList devices={visibleDevices} />
        )}
      </div>
    </Page>
  )
}

function sortDevices(tab: DeviceState, devices: IDevice[]) {
  let visibleDevices
  if (tab === 'connected') {
    visibleDevices = devices.filter(
      d => d.services.filter(s => s.state === 'connected').length
    )
  } else if (tab === 'active') {
    visibleDevices = devices.filter(
      d => d.state === 'active' || d.state === 'connected'
    )
  } else {
    visibleDevices = devices.filter(d => d.state === 'inactive')
  }

  return visibleDevices.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  )
}

import React, { useState, useEffect } from 'react'
import { DeviceList } from '../DeviceList'
import { IDevice, DeviceState, IService } from 'remote.it'
import { FormControl, Input, InputAdornment } from '@material-ui/core'
import { Icon } from '../Icon'
import { StateTabs } from '../StateTabs'
import { useTitle, navigate } from 'hookrouter'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../DeviceLoadingMessage'
import { NoDevicesMessage } from '../NoDevicesMessage'
import { ServiceList } from '../ServiceList'

export function DevicesPage({
  devices,
  fetch,
  fetching,
  getConnections,
  user,
}: Props) {
  const [tab, setTab] = useState<DeviceState>('active')

  useTitle('Devices') // TODO: Translate

  // A non-authorized user shouldn't be here, so we should
  // redirect them to sign in.
  if (!user) {
    navigate('/sign-in')
    return null
  }

  useEffect(() => {
    fetch().then(() => getConnections())
  }, [])

  // If we are loading the user's devices, we should show
  // them a nice loading indicator while we get their devices.
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
    <div className="h-100 p-md bg-gray-lighter">
      <div className="mx-auto my-md" style={{ maxWidth: '720px' }}>
        <div className="df ai-center mb-md">
          <h3 className="txt-md fw-lighter upper ls-lg gray-dark">
            Your Devices
          </h3>
          <FormControl className="ml-auto" style={{ minWidth: '300px' }}>
            <Input
              id="input-with-icon-adornment"
              startAdornment={
                <InputAdornment position="start">
                  <Icon name="search" />
                </InputAdornment>
              }
              placeholder="Search devices and services..."
            />
          </FormControl>
        </div>
        <div className="bg-white bs-2">
          <StateTabs
            state={tab}
            handleChange={(state: DeviceState) => setTab(state)}
          />
          {tab === 'connected' ? (
            <ServiceList
              services={visibleDevices.reduce(
                (all, d) => {
                  const services = d.services.filter(
                    s => s.state === 'connected'
                  )
                  return [...all, ...services]
                },
                [] as IService[]
              )}
            />
          ) : (
            <DeviceList devices={visibleDevices} />
          )}
        </div>
      </div>
    </div>
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

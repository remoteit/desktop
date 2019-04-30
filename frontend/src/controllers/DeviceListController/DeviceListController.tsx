import React, { useEffect } from 'react'
import { DevicesPage } from '../../components/DevicesPage'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { navigate, useTitle } from 'hookrouter'
import { useStore } from '../../store'
import { actions } from '../../actions'
import { Device } from '../../models/Device'
import { IDevice } from 'remote.it'

export function DeviceListController() {
  useTitle('Devices') // TODO: Translate

  const [{ auth, devices }, dispatch] = useStore()

  useEffect(() => {
    if (devices.fetched) return

    dispatch({ type: actions.devices.fetching })
    Device.all().then(devices =>
      dispatch({ type: actions.devices.fetched, devices })
    )
  }, [devices.fetched])

  // A non-authorized user shouldn't be here, so we should
  // redirect them to sign in.
  if (!auth.user) {
    navigate('/sign-in')
    return null
  }

  // If we are loading the user's devices, we should show
  // them a nice loading indicator while we get their devices.
  if (devices.fetching) {
    return <DeviceLoadingMessage />
  }

  // If the user has no devices associated with their account,
  // we should show them a friendly message.
  if (!devices.all || !devices.all.length) {
    return <NoDevicesMessage />
  }

  // If a user has devices, we should show them so they can choose
  // one to connect to.
  return <DevicesPage devices={devices.all} />
}

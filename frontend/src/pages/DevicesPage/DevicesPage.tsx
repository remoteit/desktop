import React, { useState, useEffect } from 'react'
import { DeviceList } from '../../components/DeviceList'
import { IDevice, DeviceState, IService } from 'remote.it'
import { StateTabs } from '../../components/StateTabs'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { Page } from '../Page'
import { PageHeading } from '../../components/PageHeading'
import { IconButton, Paper, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { ConnectedServiceItem } from '../../components/ConnectedServiceItem'

export function DevicesPage({
  allDevices,
  connections,
  visibleDevices,
  fetch,
  fetching,
  getConnections,
  searchOnly,
  localSearch,
  remoteSearch,
}: Props) {
  const [tab, setTab] = useState<DeviceState>('active')

  useEffect(() => {
    // Get any actively running connections
    getConnections()

    // If not in search only mode, fetch all devices.
    if (!searchOnly) fetch()
  }, [])

  if (!searchOnly) {
    // If we are loading the user's devices, we should show
    // them a nice loading indicator while we get their devices.
    // TODO: only show this if there are no devices
    if (!allDevices.length && fetching) {
      return <DeviceLoadingMessage />
    }

    // If the user has no devices associated with their account,
    // we should show them a friendly message.
    if (!allDevices || !allDevices.length) {
      return <NoDevicesMessage />
    }
  }

  const sortedDevices = sortDevices(tab, visibleDevices)

  return (
    <Page>
      <PageHeading>
        Devices
        {!searchOnly && (
          <Tooltip title="Refresh devices">
            <IconButton
              className="ml-sm"
              onClick={() => fetch()}
              disabled={fetching}
            >
              <Icon name="sync" spin={fetching} size="sm" />
            </IconButton>
          </Tooltip>
        )}
      </PageHeading>
      <div className="mb-md">
        <SearchField
          search={searchOnly ? remoteSearch : localSearch}
          searching={fetching}
        />
      </div>
      <Paper className="mb-xl">
        {/*Connections: {connections.length}*/}
        <StateTabs
          state={tab}
          handleChange={(state: DeviceState) => setTab(state)}
        />
        {tab === 'connected' ? (
          <>
            {connections.map(c => (
              <ConnectedServiceItem
                key={c.serviceID}
                name={c.serviceName}
                port={c.port}
                type={c.type}
                serviceID={c.serviceID}
              />
            ))}
          </>
        ) : (
          <DeviceList devices={sortedDevices} />
        )}
      </Paper>
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

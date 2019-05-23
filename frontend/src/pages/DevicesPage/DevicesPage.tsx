import React, { useState, useEffect } from 'react'
import { DeviceList } from '../../components/DeviceList'
import { StateTabs } from '../../components/StateTabs'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { Page } from '../Page'
import { PageHeading } from '../../components/PageHeading'
import { IconButton, Paper, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { ConnectionsList } from '../../components/ConnectionsList'

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
  query,
}: Props) {
  const [tab, setTab] = useState<Tab>('devices')

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
        <StateTabs state={tab} handleChange={(state: Tab) => setTab(state)} />
        {tab === 'connections' ? (
          <ConnectionsList connections={connections} />
        ) : (
          <DeviceList
            devices={visibleDevices}
            query={query}
            searching={fetching}
            searchOnly={searchOnly}
          />
        )}
      </Paper>
    </Page>
  )
}

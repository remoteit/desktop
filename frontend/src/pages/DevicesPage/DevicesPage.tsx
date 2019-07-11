import React from 'react'
import { DeviceList } from '../../components/DeviceList'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
// import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { Body } from '../../components/Body'
import styles from './DevicesPage.module.css'
// import { LoadingMessage } from '../../components/LoadingMessage'

export function DevicesPage({
  allDevices,
  searchPerformed,
  fetch,
  fetching,
  localSearch,
  query,
  remoteSearch,
  searching,
  searchOnly,
  setQuery,
  visibleDevices,
}: // changeSort,
// sort,
Props) {
  if (fetching && !allDevices.length) return <DeviceLoadingMessage />
  // if (fetching && searchOnly) return <DeviceLoadingMessage />
  // if (!fetching && !allDevices.length) <NoDevicesMessage />

  return (
    <>
      <div className={styles.searchHeader}>
        <SearchField
          onSubmit={remoteSearch}
          onChange={(query: string) => {
            setQuery(query)
            if (!searchOnly) localSearch(query)
          }}
          searching={searching}
          searchOnly={searchOnly}
          value={query}
        />
        {/* 
        <Tooltip
          title={
            sort === 'alpha' ? 'Sort by device state' : 'Sort by device name'
          }
          className="ml-sm"
        >
          <IconButton
            onClick={() => changeSort(sort === 'alpha' ? 'state' : 'alpha')}
          >
            <Icon
              name={sort === 'alpha' ? 'font-case' : 'scrubber'}
              size="sm"
            />
          </IconButton>
        </Tooltip>
        */}
        {!searchOnly && (
          <Tooltip title="Refresh devices" className="ml-sm">
            <IconButton onClick={() => fetch()} disabled={fetching}>
              <Icon name="sync" spin={fetching} size="sm" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <Body withSearch className="bg-white">
        <DeviceList
          devices={visibleDevices}
          searchPerformed={
            searchOnly ? searchPerformed : Boolean(visibleDevices.length)
          }
          query={query}
          searching={searching}
          searchOnly={searchOnly}
        />
      </Body>
    </>
  )
}

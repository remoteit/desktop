import React from 'react'
import { DeviceList } from '../../components/DeviceList'
import { Props } from '../../controllers/DevicePageController/DevicePageController'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { NoDevicesMessage } from '../../components/NoDevicesMessage'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { Body } from '../../components/Body'
import styles from './DevicesPage.module.css'

export function DevicesPage({
  allDevices,
  changeSort,
  fetch,
  fetching,
  searchOnly,
  localSearch,
  remoteSearch,
  query,
  sort,
  visibleDevices,
}: Props) {
  if (fetching && !allDevices.length) return <DeviceLoadingMessage />
  if (fetching && searchOnly) return <DeviceLoadingMessage />
  if (!fetching && !allDevices.length) <NoDevicesMessage />

  return (
    <>
      <div className={styles.searchHeader}>
        <SearchField
          onSubmit={searchOnly && remoteSearch}
          onChange={!searchOnly && localSearch}
          searching={fetching}
          initialValue={query}
        />
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
          query={query}
          searching={fetching}
          searchOnly={searchOnly}
        />
      </Body>
    </>
  )
}

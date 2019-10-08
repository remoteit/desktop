import React from 'react'
import { DeviceList } from '../../components/DeviceList'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { SearchField } from '../../components/SearchField'
import { ApplicationState, select } from '../../store'
import { connect } from 'react-redux'
import { IDevice } from 'remote.it'

// const visible = store.select.devices.visible
interface SelectResponse {
  visibleDevices: IDevice[]
}

// @ts-ignore
const visibleDevices: (state: any, props: any) => SelectResponse = select(
  (models: any): SelectResponse => ({
    visibleDevices: models.devices.visible,
  })
)

const mapState = (state: ApplicationState) => ({
  allDevices: state.devices.all,
  ...visibleDevices(state, {}),
  searchPerformed: state.devices.searchPerformed,
  fetching: state.devices.fetching,
  query: state.devices.query,
  searchOnly: state.devices.searchOnly,
  searching: state.devices.searching,
  user: state.auth.user,
  sort: state.devices.sort,
})

const mapDispatch = (dispatch: any) => ({
  fetch: dispatch.devices.fetch,
  localSearch: dispatch.devices.localSearch,
  remoteSearch: dispatch.devices.remoteSearch,
  setQuery: dispatch.devices.setQuery,
  changeSort: dispatch.devices.changeSort,
})

export type DevicesPageProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

export const DevicesPage = connect(
  mapState,
  mapDispatch
)(
  ({
    allDevices,
    changeSort,
    searchPerformed,
    fetch,
    fetching,
    localSearch,
    query,
    remoteSearch,
    searching,
    searchOnly,
    setQuery,
    sort,
    visibleDevices,
  }: DevicesPageProps) => {
    if (fetching && !allDevices.length) return <DeviceLoadingMessage />
    // if (fetching && searchOnly) return <DeviceLoadingMessage />
    // if (!fetching && !allDevices.length) <NoDevicesMessage />

    return (
      <div className="df ai-stretch h-100" style={{ flexFlow: 'column' }}>
        <div className="df ai-center jc-center px-sm pb-sm center bg-gray-lighter bb bc-gray-light">
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
          <Tooltip
            title={sort === 'alpha' ? 'Sort by device state' : 'Sort by device name'}
            className="ml-sm"
          >
            <IconButton onClick={() => changeSort(sort === 'alpha' ? 'state' : 'alpha')}>
              <Icon name={sort === 'alpha' ? 'font-case' : 'scrubber'} size="sm" />
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
        <DeviceList
          devices={visibleDevices}
          searchPerformed={searchOnly ? searchPerformed : Boolean(visibleDevices.length)}
          query={query}
          searching={searching}
          searchOnly={searchOnly}
        />
      </div>
    )
  }
)

// import { LoadingMessage } from '../../components/LoadingMessage'

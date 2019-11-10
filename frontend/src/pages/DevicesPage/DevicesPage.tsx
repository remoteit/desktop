import React from 'react'
import { DeviceList } from '../../components/DeviceList'
import { DeviceLoadingMessage } from '../../components/DeviceLoadingMessage'
import { IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { SearchField } from '../../components/SearchField'
import { ApplicationState, select } from '../../store'
import { connect } from 'react-redux'
import { IDevice } from 'remote.it'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

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
  ...visibleDevices(state, {}),
  allDevices: state.devices.all,
  connections: state.backend.connections.reduce((lookup: { [deviceID: string]: IConnection }, c: IConnection) => {
    lookup[c.deviceID] = c
    return lookup
  }, {}),
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
    connections,
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
    const css = useStyles()

    if (fetching && !allDevices.length) return <DeviceLoadingMessage />
    // if (fetching && searchOnly) return <DeviceLoadingMessage />
    // if (!fetching && !allDevices.length) <NoDevicesMessage />

    return (
      <div className={css.container}>
        <div className={css.fixed}>
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
          <Tooltip title={sort === 'alpha' ? 'Sort by device state' : 'Sort by device name'}>
            <IconButton onClick={() => changeSort(sort === 'alpha' ? 'state' : 'alpha')}>
              <Icon name={sort === 'alpha' ? 'font-case' : 'check-circle'} size="sm" />
            </IconButton>
          </Tooltip>
          {!searchOnly && (
            <Tooltip title="Refresh devices">
              <div>
                <IconButton onClick={() => fetch()} disabled={fetching}>
                  <Icon name="sync" spin={fetching} size="sm" />
                </IconButton>
              </div>
            </Tooltip>
          )}
        </div>
        <DeviceList
          devices={visibleDevices}
          searchPerformed={searchOnly ? searchPerformed : Boolean(visibleDevices.length)}
          connections={connections}
          query={query}
          searching={searching}
          searchOnly={searchOnly}
        />
      </div>
    )
  }
)

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
  },
  fixed: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.grayLighter,
    borderBottom: `1px solid ${styles.colors.grayLight}`,
    padding: styles.spacing.xs,
  },
})

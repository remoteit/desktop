import React, { useEffect, useState } from 'react'
import { makeStyles, LinearProgress } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { FilterDrawerContent } from '../../components/FilterDrawerContent'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { RefreshButton } from '../../buttons/RefreshButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { AccountSelect } from '../../components/AccountSelect'
import { FilterButton } from '../../buttons/FilterButton'
import { SearchField } from '../../components/SearchField'
import { useSelector } from 'react-redux'
import { getDevices } from '../../models/accounts'
import { DeviceList } from '../../components/DeviceList'
import { Container } from '../../components/Container'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DevicesPage = () => {
  const { devices, connections, fetching } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
    connections: state.backend.connections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {}),
  }))

  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <Container
      header={
        <>
          <div className={css.header}>
            <SearchField />
            <AccountSelect />
            <RefreshButton />
            <FilterButton />
          </div>
          {fetching && <LinearProgress className={css.fetching} />}
        </>
      }
      sidebar={<FilterDrawerContent />}
    >
      {fetching && !devices.length ? (
        <LoadingMessage message="Loading devices..." spinner={false} />
      ) : !devices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceList devices={devices} connections={connections} />
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `0 ${styles.spacing.md}px`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

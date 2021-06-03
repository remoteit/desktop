import React, { useEffect } from 'react'
import { makeStyles, LinearProgress } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { LoadingMessage } from '../../components/LoadingMessage'
import { RegisterButton } from '../../buttons/RegisterButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { ColumnsButton } from '../../buttons/ColumnsButton'
import { AccountSelect } from '../../components/AccountSelect'
import { ColumnsDrawer } from '../../components/ColumnsDrawer'
import { FilterDrawer } from '../../components/FilterDrawer'
import { FilterButton } from '../../buttons/FilterButton'
import { SearchField } from '../../components/SearchField'
import { useSelector } from 'react-redux'
import { getDevices } from '../../models/accounts'
import { DeviceList } from '../../components/DeviceList'
import { Container } from '../../components/Container'
import { TestUI } from '../../components/TestUI'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DevicesPage: React.FC<{ singlePanel?: boolean; restore?: boolean }> = ({ singlePanel, restore }) => {
  const { devices, connections, fetching } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
    connections: state.connections.all.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
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
            {singlePanel && (
              <>
                <RegisterButton />
                <RefreshButton />
              </>
            )}
            <FilterButton />
            <TestUI>
              <ColumnsButton />
            </TestUI>
          </div>
          {fetching && <LinearProgress className={css.fetching} />}
        </>
      }
      sidebar={
        <>
          <FilterDrawer />
          <ColumnsDrawer />
        </>
      }
    >
      {fetching && !devices.length ? (
        <LoadingMessage message="Loading devices..." spinner={false} />
      ) : !devices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceList devices={devices} connections={connections} restore={restore} />
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `0 ${styles.spacing.md}px ${styles.spacing.sm}px`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

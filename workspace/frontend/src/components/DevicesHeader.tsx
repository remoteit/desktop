import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { makeStyles, LinearProgress, List } from '@material-ui/core'
import { RegisterButton } from '../buttons/RegisterButton'
import { RefreshButton } from '../buttons/RefreshButton'
import { ColumnsButton } from '../buttons/ColumnsButton'
import { AccountSelect } from './AccountSelect'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { FilterButton } from '../buttons/FilterButton'
import { SearchField } from './SearchField'
import { IconButton } from '../buttons/IconButton'
import { DeviceSetupItem } from './DeviceSetupItem'
import { Notice } from './Notice'
import { Container } from './Container'
import { TestUI } from './TestUI'
import styles from '../styling'
import { getActiveAccountId } from '../models/accounts'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  singlePanel?: boolean
  fetching?: boolean
  restore?: boolean
  myDevice?: IDevice
}

export const DevicesHeader: React.FC<Props> = ({ singlePanel, fetching, restore, myDevice, children }) => {
  const { initialized, loggedInUser, registeredId } = useSelector((state: ApplicationState) => ({
    initialized: state.devices.initialized,
    registeredId: state.backend.device.uid,
    loggedInUser: getActiveAccountId(state) === state.auth.user?.id,
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
            <TestUI>
              <IconButton to="/devices/select" icon="check-square" title="Multi-select" />
            </TestUI>
          </div>
          {initialized &&
            (registeredId ? (
              loggedInUser && !myDevice && <Notice gutterBottom>This device is not registered to you.</Notice>
            ) : (
              <List dense disablePadding>
                <DeviceSetupItem restore={restore} />
              </List>
            ))}
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
      {children}
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

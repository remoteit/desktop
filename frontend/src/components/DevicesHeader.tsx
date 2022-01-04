import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { makeStyles, LinearProgress, List } from '@material-ui/core'
import { DeviceSetupItem } from './DeviceSetupItem'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { Container } from './Container'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  fetching?: boolean
  restore?: boolean
  myDevice?: IDevice
}

export const DevicesHeader: React.FC<Props> = ({ fetching, restore, children }) => {
  const { initialized, registeredId } = useSelector((state: ApplicationState) => ({
    initialized: state.devices.initialized,
    registeredId: state.backend.device.uid,
  }))
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <Container
      header={
        <>
          {initialized && !registeredId && (
            <List dense disablePadding>
              <DeviceSetupItem restore={restore} />
            </List>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `0 ${spacing.md}px ${spacing.sm}px`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { makeStyles, LinearProgress, List } from '@material-ui/core'
import { DeviceSetupItem } from './DeviceSetupItem'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { Container } from './Container'
import { Notice } from './Notice'
import styles from '../styling'
import { isUserAccount } from '../models/accounts'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  fetching?: boolean
  restore?: boolean
  myDevice?: IDevice
}

export const DevicesHeader: React.FC<Props> = ({ fetching, restore, myDevice, children }) => {
  const { initialized } = useSelector((state: ApplicationState) => state.devices)
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <Container
      header={
        <>
          {initialized && (
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
    padding: `0 ${styles.spacing.md}px ${styles.spacing.sm}px`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

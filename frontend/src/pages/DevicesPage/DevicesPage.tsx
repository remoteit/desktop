import React, { useEffect } from 'react'
import { DeviceList } from '../../components/DeviceList'
import { Container } from '../../components/Container'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { IconButton, Tooltip, LinearProgress, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { FilterButton } from '../../buttons/FilterButton'
import { SearchField } from '../../components/SearchField'
import { makeStyles } from '@material-ui/core/styles'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DevicesPage = () => {
  const { allDevices, connections, fetching } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    allDevices: state.devices.all.filter((d: IDevice) => !d.hidden),
    connections: state.backend.connections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {}),
  }))
  const { devices } = useDispatch<Dispatch>()
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
            <FilterButton />
            <Tooltip title="Refresh devices">
              <div>
                <IconButton
                  onClick={() => {
                    devices.set({ from: 0 })
                    devices.fetch()
                  }}
                  disabled={fetching}
                >
                  <Icon name="sync" size="sm" type="regular" />
                </IconButton>
              </div>
            </Tooltip>
          </div>
          {fetching && <LinearProgress className={css.fetching} />}
        </>
      }
    >
      {fetching && !allDevices.length ? (
        <Body center>
          <Typography variant="body1" color="textSecondary">
            Loading devices...
          </Typography>
        </Body>
      ) : !allDevices.length ? (
        <DeviceListEmpty />
      ) : (
        <DeviceList devices={allDevices} connections={connections} />
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: styles.colors.white,
    boxShadow: 'rgba(0,0,0,0.15) 0px 1px 2px',
    padding: `0 ${styles.spacing.md}px`,
    position: 'relative',
    zIndex: 1,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

import React, { useEffect } from 'react'
import { DeviceList } from '../../components/DeviceList'
import { Container } from '../../components/Container'
import { DeviceListEmpty } from '../../components/DeviceListEmpty'
import { IconButton, Tooltip, LinearProgress, Typography } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { SearchField } from '../../components/SearchField'
import { makeStyles } from '@material-ui/styles'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

export const DevicesPage = () => {
  const { allDevices, connections, fetching, filter } = useSelector((state: ApplicationState) => ({
    allDevices: state.devices.all,
    connections: state.backend.connections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {}),
    fetching: state.devices.fetching,
    filter: state.devices.filter,
  }))
  const { devices } = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    analytics.page('DevicesPage')
  }, [])

  return (
    <Container
      header={
        <>
          <div className={css.header}>
            <SearchField />
            <Tooltip title={filter ? 'Show all devices' : 'Show online devices'}>
              <IconButton
                onClick={() => {
                  devices.set({ filter: !filter })
                  devices.fetch()
                }}
              >
                <Icon
                  name={filter ? 'check-circle' : 'minus-circle'}
                  color={filter ? 'success' : 'grayLight'}
                  size="base"
                  weight="regular"
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh devices">
              <div>
                <IconButton onClick={() => devices.fetch()} disabled={fetching}>
                  <Icon name="sync" size="sm" weight="regular" />
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
    borderBottom: `1px solid ${styles.colors.grayLight}`,
    padding: `0 ${styles.spacing.md}px`,
  },
  fetching: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
})

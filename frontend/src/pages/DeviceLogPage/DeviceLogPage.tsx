import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Divider, TextField, makeStyles, List, ListItem, Box, Button, Link } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { colors, fontSizes, spacing } from '../../styling'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon/ConnectionStateIcon'

export const DeviceLogPage = () => {
  const { deviceID } = useParams()
  const {device, fetching} = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden),
    fetching: state.devices.fetching
  }))
  const dispatch = useDispatch<Dispatch>()
  const [logsToShow, setLogsToShow] = useState(device?.events.items)
  const [dateFilter, setDateFilter] = useState('')

  const css = useStyles();

  const updateList = () => {
    setLogsToShow(
     device ? device.events.items.filter(a => moment(a.timestamp).isSame(dateFilter, 'day')) : []
    )
  }

  useEffect(() => {
    dateFilter ? updateList() : setLogsToShow(device?.events.items)
  }, [device, dateFilter])

  if (!device) return null

  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="file-alt" color="grayDarker" size="lg" />
            <Title>Device Logs</Title>
          </Typography>
        </>
      }
    >
      <TextField
        type="date"
        className={css.textField}
        label="Jump to Date"
        InputLabelProps={{
          shrink: true,
        }}
        onChange={(date) => setDateFilter(date.target.value)}
      />

      <Divider />

      <List>
        {logsToShow?.map(
          item => {
            return (
              <ListItem className={css.item} key={item.id}>
                <span className={css.span}>
                  {new Date(item.timestamp).toLocaleDateString("en-US", options)}
                </span>
                <div>
                  <span className={css.icon}>
                    <ConnectionStateIcon service={device} state={item.state} size="sm" />
                  </span>
                  {device.name}
                  {item.state === 'active' ? ' come online' : ' went offline'}
                </div>
              </ListItem>
            )
          }
        )}
      </List>
      <Box className={css.box}>
      {device.events.hasMore && <Button
        color="primary"
        onClick={() => dispatch.devices.fetchLogs({id: deviceID, from: device.events.items.length})}
      >
        {fetching ? `Loading ...` : 'Load More'}
      </Button>}

      <Typography variant="body2" align="center" color="textSecondary">
          Plan Upgrade required to view logs past 90 days <br />
          <Link onClick={() => window.open('https://remote.it/developers/#pricing')}>Learn more</Link>
        </Typography>
    </Box>
      
    </Container>
  )
}

const useStyles = makeStyles({
  textField: {
    margin: spacing.xl,
    width: 200,
  },
  span: {
    marginRight: spacing.xl,
    marginLeft: spacing.xl
  },
  icon: {
    marginLeft: spacing.md
  },
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: 100,
  },
  item: {
    padding: `4px 0`,
    fontSize: fontSizes.sm,
    fontFamily: 'Roboto Mono',
    color: colors.grayDarker,
    alignItems: 'start',
    '& > span': {
      fontFamily: 'Roboto',
      color: colors.grayDark,
      minWidth: 142,
      textTransform: 'capitalize',
    },
    '& .fal': {
      color: colors.grayDarker,
    },
  },
})


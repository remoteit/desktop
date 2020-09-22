import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Divider, makeStyles, List, ListItem, Box, Button, Link, ListItemIcon } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { colors, fontSizes, spacing } from '../../styling'
import DateFnsUtils from '@date-io/date-fns'
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'
import { EventMessage } from './EventMessage'
import { EventIcon } from './EventIcon'

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_NOW = moment().add(1, 'd').format(DATE_FORMAT)

export const DeviceLogPage = () => {
  const { deviceID } = useParams()
  const { device, getting, user, items: logsToShow } = useSelector((state: ApplicationState) => {
    const device = state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden)
    return {
      device,
      getting: state.devices.getting,
      user: state.auth.user,
      items: device?.events.items,
    }
  })

  const dispatch = useDispatch<Dispatch>()
  const [dateFilter, setDateFilter] = useState('')
  const [planUpgrade, setPlanUpgrade] = useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { fetchLogs } = dispatch.devices
  const freePlan = 90

  const limitDays = () => {
    const createAt = moment(new Date()).diff(moment(device?.createdAt), 'days')
    return user?.plan.name === 'free' && createAt > freePlan ? freePlan : createAt
  }

  const minDay = new Date(moment().subtract(limitDays(), 'd').format(DATE_FORMAT))
  const maxDay = new Date(DATE_NOW)

  const css = useStyles()

  const handleChange = (date: any) => {
    setSelectedDate(date)
    fetchLogs({ id: deviceID, from: 0, maxDate: moment(date).format(DATE_FORMAT) })
    setDateFilter('top')
  }

  const fetchMore = () => {
    fetchLogs({ id: deviceID, from: device?.events.items.length, maxDate: selectedDate })
  }

  useEffect(() => {
    if (dateFilter) {
      const elements = document.getElementsByClassName(dateFilter)
      if (elements.length) {
        elements[0].scrollIntoView()
      }
      setDateFilter('')
    }
  }, [dateFilter])

  if (!device) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="file-alt" color="grayDarker" size="lg" />
            <Title>Device Logs</Title>
          </Typography>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              autoOk={true}
              className={css.textField}
              disableToolbar
              variant="inline"
              format="dd/MM/yyyy"
              id="date-picker-inline"
              label="Jump to Date"
              value={selectedDate}
              onChange={handleChange}
              inputVariant="standard"
              maxDate={maxDay}
              minDate={minDay}
              keyboardIcon={
                <Icon
                  name={getting ? 'spinner-third' : 'calendar-day'}
                  type="regular"
                  size="md"
                  spin={getting}
                  fixedWidth
                />
              }
            />
          </MuiPickersUtilsProvider>
          <Divider />
        </>
      }
    >
      <List>
        <span className="top"></span>
        {logsToShow?.map(item => {
          return <EventCell item={item} device={device} user={user} key={item.id} />
        })}
      </List>

      <Box className={css.box}>
        {device.events.hasMore ? (
          <Button color="primary" onClick={fetchMore} disabled={planUpgrade}>
            {getting ? `Loading ...` : 'Load More'}
          </Button>
        ) : (
          <Typography variant="body2" align="center" color="textSecondary">
            End of Logs
          </Typography>
        )}

        {planUpgrade && (
          <Typography variant="body2" align="center" color="textSecondary">
            Plan Upgrade required to view logs past 90 days <br />
            <Link onClick={() => window.open('https://remote.it/developers/#pricing')}>Learn more</Link>
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export function EventCell({
  item,
  device,
  user,
}: {
  item: IEvent
  device: IDevice
  user: IUser | undefined
}): JSX.Element {
  const css = useStyles()
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }

  return (
    <>
      <ListItem className={`${css.item} ${moment(item.timestamp).format(DATE_FORMAT).toString()}`}>
        <span>
          {new Date(item.timestamp).toLocaleDateString('en-US', options)}
          <ListItemIcon>
            <EventIcon {...item} />
          </ListItemIcon>
        </span>
        <EventMessage props={item} device={device} loggedinUser={user} />
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  textField: {
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
    width: 200,
  },
  icon: {
    marginLeft: spacing.md,
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
      marginLeft: spacing.sm,
    },
    '& .fal': {
      color: colors.grayDarker,
    },
  },
})

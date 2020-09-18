import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { Dispatch, ApplicationState } from '../../store'
import {
  Typography,
  Divider,
  makeStyles,
  List,
  ListItem,
  Box,
  Button,
  Link,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
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
  const { device, getting, user } = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden),
    getting: state.devices.getting,
    user: state.auth.user,
  }))

  const dispatch = useDispatch<Dispatch>()
  const [logsToShow, setlogsToShow] = useState(device?.events.items)
  const [dateFilter, setDateFilter] = useState('')
  const [planUpgrade, setPlanUpgrade] = useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const freePlan = 90

  const limitDays = () => {
    const createAt = moment(new Date()).diff(moment(device?.createdAt), 'days')
    if (createAt < freePlan) {
      return createAt
    }
    return user?.plan.name === 'free' ? freePlan : 0
  }
  const minDay = new Date(moment().subtract(limitDays(), 'd').format(DATE_FORMAT))
  const maxDay = new Date(DATE_NOW)

  const css = useStyles()

  const handleChange = (date: any) => {
    setSelectedDate(date)
    // find the firts date before of filter
    const lastItem = logsToShow && logsToShow[logsToShow?.length - 1]

    if (moment(date).format(DATE_FORMAT) < moment(lastItem?.timestamp).format(DATE_FORMAT)) {
      setDateFilter('loadMore')
      return
    }
    const item = device?.events?.items.find(item => moment(item.timestamp).isSameOrBefore(date))?.timestamp || date

    setDateFilter(moment(item).format(DATE_FORMAT).toString())
  }

  const fetchMore = () => {
    dispatch.devices.fetchLogs({ id: deviceID, from: device?.events.items.length })

    if (user?.plan.name === 'free' && device?.events.items) {
      let lastAllowed = new Date(moment().subtract(freePlan, 'd').format())
      setlogsToShow(device?.events.items.filter(item => moment(item.timestamp).isSameOrAfter(lastAllowed)))
      logsToShow && logsToShow?.length < freePlan && setPlanUpgrade(true)
    } else {
      setlogsToShow(device?.events.items)
    }
  }

  useEffect(() => {
    const elements = document.getElementsByClassName(dateFilter)
    if (elements.length) {
      elements[0].scrollIntoView()
      // if not has result -> check if we could get more items
    }
    setlogsToShow(device?.events.items)
  }, [device, selectedDate, dateFilter])

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
            />
          </MuiPickersUtilsProvider>
          <Divider />
        </>
      }
    >
      <List>
        {logsToShow?.map(item => {
          return <EventCell item={item} device={device} user={user} key={item.id} />
        })}
      </List>

      <Box className={css.box}>
        {device.events.hasMore ? (
          <Button color="primary" onClick={fetchMore} disabled={planUpgrade} className="loadMore">
            {getting ? `Loading ...` : 'Load More'}
          </Button>
        ) : (
          <Typography variant="body2" align="center" color="textSecondary" className="loadMore">
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
      <ListItem className={moment(item.timestamp).format(DATE_FORMAT).toString()}>
        <span className={css.span}>{new Date(item.timestamp).toLocaleDateString('en-US', options)}</span>
        <ListItemIcon>
          <EventIcon {...item} />
        </ListItemIcon>
        <ListItemText>
          <div className="df ai-center">
            <EventMessage props={item} device={device} loggedinUser={user} />
          </div>
        </ListItemText>
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
  span: {
    marginRight: spacing.xl,
    marginLeft: spacing.xl,
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
    },
    '& .fal': {
      color: colors.grayDarker,
    },
  },
})

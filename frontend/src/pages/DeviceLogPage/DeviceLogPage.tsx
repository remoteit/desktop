import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import {
  Typography,
  makeStyles,
  List,
  ListItem,
  Box,
  Button,
  Link,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { colors, fontSizes, spacing } from '../../styling'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { EventMessage } from './EventMessage'
import { DatePicker } from '../../components/DatePicker'
import { Container } from '../../components/Container'
import { EventIcon } from './EventIcon'
import { Icon } from '../../components/Icon'

const DAY = 1000 * 60 * 60 * 24

export const DeviceLogPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { events, idDevice, fetchingMore, fetching, user, limits, items } = useSelector((state: ApplicationState) => ({
    events: state.logs.events,
    idDevice: state.logs.events?.deviceId,
    fetchingMore: state.logs.fetchingMore,
    fetching: state.logs.fetching,
    user: state.auth.user,
    limits: state.licensing.limits,
    items: state.logs?.events?.deviceId === device?.id ? state.logs?.events?.items : [],
  }))
  const dispatch = useDispatch<Dispatch>()
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { fetchLogs } = dispatch.logs
  const createAt = device?.createdAt ? new Date(device?.createdAt) : new Date()
  const createAt_days = Math.floor((new Date().getTime() - createAt.getTime()) / DAY)
  const css = useStyles()

  let daysAllowed = 0
  let logLimit = (limits && limits?.filter(limit => limit.name === 'log-limit')[0].value.toString()) || '0'
  let limitNumber = (logLimit && logLimit.replace(/\D/g, '')) || '0'

  switch (logLimit.slice(-1)) {
    case 'D':
      daysAllowed = limitNumber
      break
    case 'M':
      daysAllowed = limitNumber.parseInt() * 30
      break
    case 'Y':
      daysAllowed = limitNumber.parseInt() * 365
      break
    default:
      daysAllowed = 7
      break
  }
  const limitDays = () => (createAt_days > daysAllowed ? daysAllowed : createAt_days)
  const minDay = new Date(new Date().getTime() - DAY * limitDays())
  minDay.setHours(0)

  useEffect(() => {
    if (idDevice !== device?.id && device?.id) {
      fetchLogs({ id: device.id, from: 0, minDate: `${minDay}` })
      console.log('Fetching Logs')
    }
  }, [device?.id])

  if (!device) return null

  const onChange = (date: any) => {
    setSelectedDate(date)
  }

  const fetchMore = () => {
    fetchLogs({ id: device.id, from: items?.length, maxDate: `${selectedDate} 23:59:59`, minDate: `${minDay}` })
  }

  return (
    <DeviceHeaderMenu device={device}>
      <Container
        bodyProps={{ inset: true }}
        header={
          <List>
            <ListItem dense>
              <ListItemIcon>
                <Icon name={fetching ? 'spinner-third' : 'calendar-day'} size="md" spin={fetching} fixedWidth />
              </ListItemIcon>
              <DatePicker
                onChange={onChange}
                minDay={minDay}
                selectedDate={selectedDate}
                fetching={fetching}
                label="Jump to Date"
              />
              <ListItemSecondaryAction>
                <CSVDownloadButton
                  deviceID={device.id}
                  maxDate={selectedDate?.toDateString() || new Date().toString()}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        }
      >
        <List className={css.item}>
          {!fetching && items?.map((item: any) => <EventCell item={item} device={device} user={user} key={item.id} />)}
        </List>
        <Box className={css.box}>
          {events?.hasMore || fetching ? (
            <Button color="primary" onClick={fetchMore} disabled={fetchingMore || fetching}>
              {fetchingMore || fetching ? `Loading ...` : 'Load More'}
            </Button>
          ) : (
            <Typography variant="body2" align="center" color="textSecondary">
              End of Logs
            </Typography>
          )}
          {!events?.hasMore && !fetching && createAt_days > daysAllowed && (
            <Typography variant="body2" align="center" color="textSecondary">
              Plan upgrade required to view logs past {daysAllowed} days <br />
              <Link onClick={() => window.open('https://link.remote.it/licensing/plans')}>Learn more</Link>
            </Typography>
          )}
        </Box>
      </Container>
    </DeviceHeaderMenu>
  )
}

const options = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

export function EventCell({ item, device, user }: { item: IEvent; device: IDevice; user?: IUser }): JSX.Element {
  return (
    <ListItem>
      <span>{new Date(item.timestamp).toLocaleDateString('en-US', options)}</span>
      <ListItemIcon>
        <EventIcon {...item} />
      </ListItemIcon>
      <EventMessage item={item} device={device} loggedInUser={user} />
    </ListItem>
  )
}

const useStyles = makeStyles({
  textField: {
    display: 'block',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
    width: 200,
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
    paddingTop: 0,
    '& li': {
      padding: `4px 0`,
      fontSize: fontSizes.sm,
      color: colors.grayDark,
      alignItems: 'start',
      '& > span': {
        fontSize: fontSizes.xxs,
        textAlign: 'right',
        fontFamily: 'Roboto Mono',
        minWidth: 150,
      },
      '& b': {
        color: colors.grayDarkest,
        fontWeight: 400,
      },
      '& i': {
        color: colors.grayDarker,
        fontStyle: 'normal',
      },
    },
  },
})

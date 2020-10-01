import React, { useEffect, useState } from 'react'
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
  TextField,
  FilledTextFieldProps,
  OutlinedTextFieldProps,
  StandardTextFieldProps,
} from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { colors, fontSizes, spacing } from '../../styling'
import { EventMessage } from './EventMessage'
import { EventIcon } from './EventIcon'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { getOwnDevices } from '../../models/accounts'

const TIME = 1000 * 60 * 60 * 24

export const DeviceLogPage = () => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { device, fetchingMore, fetching, user, items: logsToShow } = useSelector((state: ApplicationState) => {
    // const device = state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden)
    const device = getOwnDevices(state).find(d => d.id === state.backend.device.uid)
    return {
      device,
      fetchingMore: state.devices.fetchingMore,
      fetching: state.devices.fetching,
      user: state.auth.user,
      items: device?.events.items,
    }
  })

  const dispatch = useDispatch<Dispatch>()
  const [planUpgrade, setPlanUpgrade] = useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { fetchLogs } = dispatch.devices
  const freePlan = 90

  const limitDays = () => {
    const createAt = device?.createdAt ? new Date(device?.createdAt) : new Date()
    const createAt_days = Math.floor((new Date().getTime() - createAt.getTime()) / TIME)
    return user?.plan.name === 'free' && createAt_days > freePlan ? freePlan : createAt_days
  }

  const minDay = new Date(new Date().getTime() - TIME * limitDays())

  const css = useStyles()

  const handleChange = (date: any) => {
    setSelectedDate(date)
    fetchLogs({ id: deviceID, from: 0, maxDate: `${date}` })
  }

  const fetchMore = () => {
    fetchLogs({ id: deviceID, from: device?.events.items.length, maxDate: `${selectedDate} 23:59:59` })
  }

  if (!device) return null

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1" className={css.header}>
            <Icon name="file-alt" color="grayDarker" size="lg" />
            <Title>Device Logs</Title>
            <DatePicker
              handleChange={handleChange}
              minDay={minDay}
              selectedDate={selectedDate}
              fetching={fetching}
              label="Jump to Date"
            />

            <CSVDownloadButton deviceID={deviceID} maxDate={selectedDate?.toDateString() || new Date().toString()} />
          </Typography>
        </>
      }
    >
      <List className={css.item}>
        {!fetching && logsToShow?.map((item: any) => <EventCell item={item} device={device} user={user} key={item.id} />)}
      </List>

      <Box className={css.box}>
        {device.events.hasMore ? (
          <Button color="primary" onClick={fetchMore} disabled={planUpgrade}>
            {fetchingMore || fetching ? `Loading ...` : 'Load More'}
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
      <EventMessage props={item} device={device} loggedInUser={user} />
    </ListItem>
  )
}

const useStyles = makeStyles({
  header: {
    marginBottom: spacing.md,
  },
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

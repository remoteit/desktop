import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  Box,
  Button,
  makeStyles,
  Typography,
  Link,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { Container } from '../Container'
import { DeviceHeaderMenu } from '../DeviceHeaderMenu'
import { DatePicker } from '../DatePicker'
import { Notice } from '../Notice'
import { Icon } from '../Icon'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { colors, fontSizes, spacing } from '../../styling'
import { EventItem } from './EventItem'
import { eventLogs } from '../../models/logs'
import { DateTime } from 'luxon'

export interface LogListProps {
  fetching: boolean
  onChangeDate?: (date: any) => void
  fetchLogs: (data: eventLogs, offset?: boolean, selectDevice?: Date | null) => void
  selectedDate: Date | null
  device?: IDevice
  events?: IEventList
  fetchingMore: boolean
  title?: React.ReactElement
}

const DAY = 1000 * 60 * 60 * 24

export const EventList: React.FC<LogListProps> = ({
  fetching,
  onChangeDate,
  fetchLogs,
  selectedDate,
  device,
  events,
  fetchingMore,
  title,
}) => {
  const { limits, user } = useSelector((state: ApplicationState) => ({
    limits: state.licensing.limits,
    user: state.auth.user,
  }))
  const [itemOffset, setItemOffset] = useState(0)
  const pageSize = 100
  const [minDate, setMinDate] = useState<Date>()
  const css = useStyles()
  const [planUpgrade, setPlanUpgrade] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<DateTime>(DateTime.local())
  let daysAllowed = 0
  let logLimit = (limits && limits.filter(limit => limit.name === 'log-limit')[0]?.value?.toString()) || '0'
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

  const limitDays = () => {
    let create_days = 0
    if (device) {
      const createAt = device?.createdAt ? new Date(device?.createdAt) : new Date()
      create_days = Math.floor((new Date().getTime() - createAt.getTime()) / DAY)
    }
    let limit = daysAllowed
    if (create_days > 0) {
      if (create_days > daysAllowed) {
        setPlanUpgrade(true)
      } else {
        setPlanUpgrade(false)
        limit = create_days
      }
    } else {
      setPlanUpgrade(true)
    }
    return new Date(new Date().getTime() - DAY * limit)
  }

  useEffect(() => {
    let minDay = limitDays()
    minDay.setHours(0)
    setMinDate(minDay)
    fetchLogs(
      { id: device?.id || '', from: itemOffset, maxDate: `${selectedDate}`, minDate: `${minDay}` },
      false,
      selectedDate
    )
  }, [selectedDate])

  const fetchMore = () => {
    const newOffset = itemOffset + pageSize
    fetchLogs({ id: device?.id || '', from: newOffset, minDate: `${minDate}`, maxDate: `${selectedDate}` }, true, null)
  }

  const refresh = () => {
    fetchLogs({ id: device?.id || '', from: 0, minDate: `${minDate}` })
  }
  const container = () => {
    return (
      <>
        <Container
          bodyProps={{ inset: true }}
          header={
            <>
              {title}
              <List>
                <ListItem dense>
                  <ListItemIcon>
                    <Icon name={fetching ? 'spinner-third' : 'calendar-day'} size="md" spin={fetching} fixedWidth />
                  </ListItemIcon>
                  {onChangeDate && (
                    <>
                      <DatePicker
                        onChange={onChangeDate}
                        minDay={minDate}
                        selectedDate={selectedDate}
                        fetching={fetching}
                        label="Jump to Date"
                      />
                    </>
                  )}
                </ListItem>
                <ListItemSecondaryAction>
                  {!device ? (
                    <>
                      <Box ml="auto" display="flex" alignItems="center">
                        <i className={css.dateUpdate}>
                          {' '}
                          {'Updated ' + lastUpdated.toLocaleString(DateTime.DATETIME_MED)}{' '}
                        </i>
                        <CSVDownloadButton
                          minDate={minDate?.toDateString() || new Date().toString()}
                          maxDate={selectedDate?.toDateString() || new Date().toString()}
                        />
                        <Tooltip title="Refresh List">
                          <IconButton onClick={refresh}>
                            <Icon name="sync" spin={fetching} size="md" fixedWidth />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </>
                  ) : (
                    <CSVDownloadButton
                      deviceID={device.id}
                      minDate={minDate?.toDateString() || new Date().toString()}
                      maxDate={selectedDate?.toDateString() || new Date().toString()}
                    />
                  )}
                </ListItemSecondaryAction>
              </List>
            </>
          }
        >
          <List className={css.item}>
            {!fetching &&
              events?.items?.map((item: any) => <EventItem item={item} device={device} user={user} key={item.id} />)}
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
          </Box>
          {!events?.hasMore && !fetching && planUpgrade && (
            <Notice
              severity="warning"
              button={
                <Button variant="contained" href="https://link.remote.it/licensing/plans" size="small" target="_blank">
                  Upgrade
                </Button>
              }
            >
              Plan upgrade required to view logs past {daysAllowed} days
            </Notice>
          )}
        </Container>
      </>
    )
  }

  return device ? <DeviceHeaderMenu device={device}> {container()}</DeviceHeaderMenu> : container()
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
  dateUpdate: {
    fontSize: fontSizes.xxs,
    marginRight: spacing.sm,
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

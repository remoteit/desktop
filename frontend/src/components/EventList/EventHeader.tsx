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
}

const DAY = 1000 * 60 * 60 * 24

export const EventHeader: React.FC<LogListProps> = ({ fetching, onChangeDate, fetchLogs, selectedDate, device }) => {
  const { limits } = useSelector((state: ApplicationState) => state.licensing)
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

  return (
    <List className={css.list}>
      <ListItem dense>
        <ListItemIcon>
          <Icon name="calendar-day" size="md" fixedWidth />
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
              <i className={css.dateUpdate}> {'Updated ' + lastUpdated.toLocaleString(DateTime.DATETIME_MED)} </i>
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
  )
}

const useStyles = makeStyles({
  list: {
    paddingTop: 0,
  },
  dateUpdate: {
    fontSize: fontSizes.xxs,
    marginRight: spacing.sm,
  },
})

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  Box,
  makeStyles,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { DatePicker } from '../DatePicker'
import { Icon } from '../Icon'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { fontSizes, spacing } from '../../styling'
import { eventLogs } from '../../models/logs'
import { DateTime } from 'luxon'

export interface LogListProps {
  fetching: boolean
  onChangeDate?: (date: any) => void
  fetchLogs: (data: eventLogs, offset?: boolean, selectDevice?: Date | null) => void
  selectedDate: Date | null
  device?: IDevice
  setPlanUpgrade: (planUpgrade: boolean) => void
  setDaysAllowed: (daysAllowed: number) => void
}

const DAY = 1000 * 60 * 60 * 24

export const EventHeader: React.FC<LogListProps> = ({ fetching, onChangeDate, fetchLogs, selectedDate, device, setPlanUpgrade, setDaysAllowed }) => {
  const { limits, minDate, maxDate, itemOffset, daysAllowed} = useSelector((state: ApplicationState) => ({
    limits: state.licensing.limits,
    minDate: state.logs.minDate,
    maxDate: state.logs.maxDate,
    itemOffset: state.logs.from,
    daysAllowed: state.logs.daysAllowed
  }))
  const css = useStyles()
  const [lastUpdated, setLastUpdated] = useState<DateTime>(DateTime.local())
  let logLimit = (limits && limits.filter(limit => limit.name === 'log-limit')[0]?.value?.toString()) || '0'
  let limitNumber = (logLimit && logLimit.replace(/\D/g, '')) || '0'
  let allowed = 7

  switch (logLimit.slice(-1)) {
    case 'D':
      allowed = limitNumber
      break
    case 'M':
      allowed = limitNumber.parseInt() * 30
      break
    case 'Y':
      allowed = limitNumber.parseInt() * 365
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
    fetchLogs(
      { id: device?.id || '', from: itemOffset, maxDate: `${selectedDate}`, minDate: `${minDay}` },
      false,
      selectedDate
    )
    setDaysAllowed(allowed)
  }, [selectedDate])

  

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
              <CSVDownloadButton />
              <Tooltip title="Refresh List">
                <IconButton onClick={refresh}>
                  <Icon name="sync" spin={fetching} size="md" fixedWidth />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <CSVDownloadButton />
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

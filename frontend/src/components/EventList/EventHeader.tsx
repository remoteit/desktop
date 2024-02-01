import React, { useEffect } from 'react'
import { isToday } from '../../helpers/dateHelper'
import { DateTime } from 'luxon'
import { limitDays } from '../../models/plans'
import { selectLimit } from '../../selectors/organizations'
import { Dispatch, State } from '../../store'
import { selectActiveAccountId } from '../../selectors/accounts'
import { useDispatch, useSelector } from 'react-redux'
import { List, ListItem, ListItemSecondaryAction } from '@mui/material'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { DatePicker } from '../DatePicker'

const DAY = 1000 * 60 * 60 * 24

export const EventHeader: React.FC<{ device?: IDevice }> = ({ device }) => {
  const dispatch = useDispatch<Dispatch>()
  const { fetch, set } = dispatch.logs

  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const activeAccount = useSelector(selectActiveAccountId)
  const { events, deviceId, minDate, selectedDate } = useSelector((state: State) => state.logs)

  let allowed = limitDays(logLimit)

  const getMinDays = () => {
    let lifetimeDays = 0
    if (device) {
      const createdAt = device?.createdAt ? new Date(device.createdAt) : new Date()
      lifetimeDays = Math.floor((new Date().getTime() - createdAt.getTime()) / DAY)
    }
    let limit = allowed
    if (lifetimeDays > 0) {
      if (lifetimeDays > allowed) {
        set({ planUpgrade: true })
      } else {
        set({ planUpgrade: false })
        limit = lifetimeDays
      }
    } else {
      set({ planUpgrade: true })
    }
    return DateTime.now().endOf('day').minus({ days: limit }).toJSDate()
  }

  useEffect(() => {
    set({ daysAllowed: allowed, minDate: getMinDays(), maxDate: undefined, selectedDate: undefined })
    if (!events.items.length || device?.id !== deviceId) {
      set({ deviceId: device?.id, after: undefined, events: { ...events, items: [] } })
      fetch()
    }
  }, [activeAccount])

  const handleChangeDate = (date: Date | null | undefined) => {
    // set to end of day
    date?.setHours(23, 59, 59, 999)
    date = date || undefined
    set({
      selectedDate: date,
      after: undefined,
      minDate,
      maxDate: date && isToday(date) ? undefined : date,
      events: { ...events, items: [] },
    })
    fetch()
  }

  return (
    <List disablePadding>
      <ListItem dense>
        <DatePicker onChange={handleChangeDate} minDay={minDate} selectedDate={selectedDate} />
        <ListItemSecondaryAction>
          <CSVDownloadButton />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  )
}

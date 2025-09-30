import React, { useEffect, useMemo } from 'react'
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

const endOfToday = () => DateTime.now().endOf('day')

const retentionSpanDays = (allowedDays: number, device?: IDevice): number => {
  if (!device?.createdAt) return allowedDays
  const createdAt = new Date(device.createdAt)
  const lifetime = Math.max(Math.floor((Date.now() - createdAt.getTime()) / DAY), 0)
  return lifetime ? Math.min(lifetime, allowedDays) : allowedDays
}

const retentionStartDate = (allowedDays: number, device?: IDevice): Date | undefined => {
  if (!allowedDays) return undefined
  return endOfToday().minus({ days: retentionSpanDays(allowedDays, device) }).toJSDate()
}

const hasDateChanged = (lhs?: Date, rhs?: Date) => lhs?.getTime() !== rhs?.getTime()

export const EventHeader: React.FC<{ device?: IDevice }> = ({ device }) => {
  const dispatch = useDispatch<Dispatch>()
  const { fetch, set } = dispatch.logs

  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const activeAccount = useSelector(selectActiveAccountId)
  const { events, deviceId, minDate, selectedDate, daysAllowed } = useSelector((state: State) => state.logs)

  const allowedDays = Math.max(limitDays(logLimit?.value) || 0, 0)
  const minDateValue = useMemo(() => retentionStartDate(allowedDays, device), [allowedDays, device?.createdAt])

  useEffect(() => {
    const contextChanged = device?.id !== deviceId || daysAllowed !== allowedDays
    const isInitialLoad = !events.items.length && !deviceId && !device?.id

    const updates: Partial<State['logs']> = {}

    if (daysAllowed !== allowedDays) updates.daysAllowed = allowedDays

    if (hasDateChanged(minDate, minDateValue)) updates.minDate = minDateValue

    if (contextChanged) {
      Object.assign(updates, {
        after: undefined,
        events: { ...events, items: [] },
        maxDate: undefined,
        selectedDate: undefined,
        planUpgrade: false,
      })
    }

    if (Object.keys(updates).length) set(updates)

    if (contextChanged || isInitialLoad) fetch()
  }, [activeAccount, allowedDays, daysAllowed, device?.id, deviceId, minDate, minDateValue])

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
      planUpgrade: false,
    })
    fetch()
  }

  return (
    <List disablePadding>
      <ListItem dense>
        <DatePicker onChange={handleChangeDate} minDay={minDate} selectedDate={selectedDate} />
        <ListItemSecondaryAction>
          <CSVDownloadButton fetchUrl={dispatch.logs.fetchUrl} />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  )
}

import React, { useEffect } from 'react'
import { DateTime } from 'luxon'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, List, ListItem, ListItemSecondaryAction } from '@material-ui/core'
import { getLimit, limitDays } from '../../models/licensing'
import { CSVDownloadButton } from '../../buttons/CSVDownloadButton'
import { DatePicker } from '../DatePicker'

const DAY = 1000 * 60 * 60 * 24

export const EventHeader: React.FC<{ device?: IDevice }> = ({ device }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { fetch, set } = dispatch.logs

  const { events, deviceId, logLimit, minDate, selectedDate } = useSelector((state: ApplicationState) => ({
    logLimit: getLimit('log-limit', state) || 'P1W',
    ...state.logs,
  }))

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
    set({ daysAllowed: allowed, minDate: getMinDays(), maxDate: new Date(), selectedDate: selectedDate || new Date() })
    if (!events.items.length || device?.id !== deviceId) {
      set({ deviceId: device?.id, from: 0, events: { ...events, items: [] } })
      fetch()
    }
  }, [])

  const handleChangeDate = (date: any) => {
    set({ selectedDate: date, from: 0, minDate, maxDate: date, events: { ...events, items: [] } })
    fetch()
  }

  return (
    <List className={css.list}>
      <ListItem dense>
        <DatePicker onChange={handleChangeDate} minDay={minDate} selectedDate={selectedDate} />
      </ListItem>
      <ListItemSecondaryAction>
        <CSVDownloadButton />
      </ListItemSecondaryAction>
    </List>
  )
}

const useStyles = makeStyles({
  list: { paddingTop: 0 },
})

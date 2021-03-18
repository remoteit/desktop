import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EventList } from '../../components/EventList'
import { eventLogs } from '../../models/logs'
import { Dispatch, ApplicationState } from '../../store'

export const UserLogPage: React.FC = () => {
  const { events, fetchingMore, fetching } = useSelector((state: ApplicationState) => ({
    events: state.logs.events,
    fetchingMore: state.logs.fetchingMore,
    fetching: state.logs.fetching,
  }))
  const dispatch = useDispatch<Dispatch>()
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { getEventsLogs } = dispatch.logs

  const onChangeDate = (date: any) => {
    setSelectedDate(date)
  }

  const getDeviceLogs = (data: eventLogs) => {
    getEventsLogs(data)
  }

  return (
    <EventList
      fetching={fetching}
      fetchLogs={getDeviceLogs}
      events={events}
      selectedDate={selectedDate}
      onChangeDate={onChangeDate}
      fetchingMore={fetchingMore}
    />
  )
}

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { EventList } from '../../components/EventList'
import { eventLogs } from '../../models/logs'

export const DeviceLogPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { events, fetchingMore, fetching, deviceId } = useSelector((state: ApplicationState) => ({
    deviceId: state.logs.events?.deviceId,
    events: state.logs.events,
    fetchingMore: state.logs.fetchingMore,
    fetching: state.logs.fetching,
  }))
  const dispatch = useDispatch<Dispatch>()
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { fetchLogs } = dispatch.logs

  if (!device) return null

  const onChangeDate = (date: any) => {
    setSelectedDate(date)
  }

  const getDeviceLogs = (data: eventLogs, offset: boolean, maxDate: Date | null) => {
    if (deviceId !== device.id || offset || maxDate !== null) {
      fetchLogs(data)
    }
  }

  return (
    <EventList
      fetching={fetching}
      onChangeDate={onChangeDate}
      fetchLogs={getDeviceLogs}
      selectedDate={selectedDate}
      device={device}
      events={events}
      fetchingMore={fetchingMore}
    />
  )
}

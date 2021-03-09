import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { EventList } from '../../components/EventList'
import { getAllDevices } from '../../models/accounts'
import { eventLogs } from '../../models/logs'
import { Dispatch, ApplicationState } from '../../store'

export const DeviceLogPage: React.FC = () => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { device, events, fetchingMore, fetching, deviceId } = useSelector((state: ApplicationState) => {
    const device = getAllDevices(state).find(d => d.id === deviceID)
    return {
      device,
      deviceId: state.logs.events?.deviceId,
      events: state.logs.events,
      fetchingMore: state.logs.fetchingMore,
      fetching: state.logs.fetching,
    }
  })
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

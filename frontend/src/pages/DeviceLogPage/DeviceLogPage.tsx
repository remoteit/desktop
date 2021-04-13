import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { EventHeader } from '../../components/EventList/EventHeader'
import { EventList } from '../../components/EventList'
import { eventLogs } from '../../models/logs'

export const DeviceLogPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { events, fetchingMore, fetching, deviceId, selectedDate, itemOffset, minDate} = useSelector((state: ApplicationState) => ({
    deviceId: state.logs.events?.deviceId,
    events: state.logs.events,
    fetchingMore: state.logs.fetchingMore,
    fetching: state.logs.fetching,
    selectedDate: state.logs.selectedDate,
    itemOffset: state.logs.from,
    minDate: state.logs.minDate
  }))
  const dispatch = useDispatch<Dispatch>()
  const { fetchLogs, set } = dispatch.logs

  useEffect(() => {
    set ({ from: 0 , selectedDate: new Date()})
  }, [])

  if (!device) return null

  const onChangeDate = (date: any) => {
    set({ selectedDate: date })
    fetchLogs({ id: device.id, from: 0, minDate, maxDate: `${date}` })
  }

  const getDeviceLogs = (data: eventLogs, offset: boolean, maxDate: Date | null) => {
    if (deviceId !== device.id || offset || maxDate !== null) {
      fetchLogs(data)
    }
  }

  const onFetchMore = () => {
    const newOffset = itemOffset + 100
    fetchLogs({ id: device.id, from: newOffset, minDate, maxDate: `${selectedDate}` })
  }

  const setPlanUpgrade = (planUpgrade: boolean) => {
    set({ planUpgrade })
  }

  const setDaysAllowed = (daysAllowed: number) => {
    set({ daysAllowed })
  }

  return (
    <DeviceHeaderMenu
      device={device}
      header={
        <EventHeader
          fetching={fetching}
          onChangeDate={onChangeDate}
          fetchLogs={getDeviceLogs}
          selectedDate={selectedDate}
          device={device}
          setDaysAllowed={setDaysAllowed}
          setPlanUpgrade={setPlanUpgrade}
        />
      }
    >
      <EventList
        fetching={fetching}
        device={device}
        events={events}
        fetchingMore={fetchingMore}
        onFetchMore={onFetchMore}
      />
    </DeviceHeaderMenu>
  )
}

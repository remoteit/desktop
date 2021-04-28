import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography } from '@material-ui/core'
import { EventList } from '../../components/EventList'
import { eventLogs } from '../../models/logs'
import { EventHeader } from '../../components/EventList/EventHeader'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'

export const UserLogPage: React.FC = () => {
  const { events, fetchingMore, fetching, selectedDate, itemOffset, minDate } = useSelector(
    (state: ApplicationState) => ({
      events: state.logs.events,
      fetchingMore: state.logs.fetchingMore,
      fetching: state.logs.fetching,
      selectedDate: state.logs.selectedDate,
      itemOffset: state.logs.from,
      minDate: state.logs.minDate,
    })
  )
  const dispatch = useDispatch<Dispatch>()
  const { getEventsLogs, set } = dispatch.logs
  useEffect(() => {
    set({ from: 0, selectedDate: new Date() })
  }, [])

  const onFetchMore = () => {
    const newOffset = itemOffset + 100
    getEventsLogs({ id: '', from: newOffset, minDate, maxDate: `${selectedDate}` })
  }

  const onChangeDate = (date: any) => {
    set({ selectedDate: date })
    getEventsLogs({ id: '', from: 0, minDate, maxDate: `${date}` })
  }

  const setPlanUpgrade = (planUpgrade: boolean) => {
    set({ planUpgrade })
  }

  const setDaysAllowed = (daysAllowed: number) => {
    set({ daysAllowed })
  }

  const getDeviceLogs = (data: eventLogs) => {
    getEventsLogs(data)
  }

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>Logs</Title>
          </Typography>
          <EventHeader
            fetching={fetching}
            onChangeDate={onChangeDate}
            fetchLogs={getDeviceLogs}
            selectedDate={selectedDate}
            setPlanUpgrade={setPlanUpgrade}
            setDaysAllowed={setDaysAllowed}
          />
        </>
      }
    >
      <EventList fetching={fetching} events={events} fetchingMore={fetchingMore} onFetchMore={onFetchMore} />
    </Container>
  )
}

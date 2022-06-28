import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Tooltip, IconButton } from '@mui/material'
import { EventList } from '../../components/EventList'
import { EventHeader } from '../../components/EventList/EventHeader'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'

export const UserLogPage: React.FC = () => {
  const { fetching } = useSelector((state: ApplicationState) => state.logs)
  const { logs } = useDispatch<Dispatch>()

  const refresh = () => {
    logs.set({ from: 0, maxDate: new Date() })
    logs.fetch()
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>Logs</Title>
            <Tooltip title="Refresh List">
              <IconButton onClick={refresh} size="large">
                <Icon name="sync" spin={fetching} size="sm" fixedWidth />
              </IconButton>
            </Tooltip>
          </Typography>
          <EventHeader />
        </>
      }
    >
      <EventList />
    </Container>
  )
}

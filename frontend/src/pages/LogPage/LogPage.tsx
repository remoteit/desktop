import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ApplicationState } from '../../store'
import { Typography } from '@material-ui/core'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { Icon } from '../../components/Icon'
import { spacing } from '../../styling'

export const LogPage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const id = connection ? connection.id : ''
  const log = useSelector((state: ApplicationState) => state.logs[id] || [])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="stream" size="lg" />
            <span style={{ marginLeft: spacing.md }}>Raw Connection Log</span>
          </Typography>
        </>
      }
    >
      <Columns count={1} inset>
        {log.length ? <pre>{log.join('\n')}</pre> : <Typography variant="h4">Log is empty</Typography>}
      </Columns>
    </Container>
  )
}

import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const LogPage: React.FC = () => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const dispatch = useDispatch<Dispatch>()
  const log = useSelector((state: ApplicationState) => state.logs[serviceID] || [])

  useEffect(() => {
    analyticsHelper.page('LogPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="stream" size="lg" />
            <Title inline>Raw Connection Log</Title>
            <Tooltip title="Clear log">
              <IconButton onClick={() => dispatch.logs.clear(serviceID)}>
                <Icon name="trash" size="md" fixedWidth />
              </IconButton>
            </Tooltip>
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

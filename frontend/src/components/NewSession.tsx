import React from 'react'
import { useParams, matchPath, useLocation } from 'react-router-dom'
import { Collapse } from '@material-ui/core'
import { connectionState } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { SessionsList } from '../components/SessionsList'
import { useSelector } from 'react-redux'
import { selectById } from '../models/devices'

export const NewSession: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const location = useLocation()
  const showNew = matchPath(location.pathname, { path: '/connections/new' })
  const { serviceID } = useParams<{ serviceID?: string }>()
  const session = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      state: connectionState(service),
      timestamp: new Date(),
      platform: 0,
      user: state.auth.user,
      target: {
        id: service?.id || '',
        deviceId: device?.id || '',
        platform: device?.targetPlatform || 0,
        name: service?.name || '',
      },
    }
  })

  return (
    <Collapse in={!!showNew} timeout={400}>
      <SessionsList title="New" sessions={[session]} offline isNew />
    </Collapse>
  )
}

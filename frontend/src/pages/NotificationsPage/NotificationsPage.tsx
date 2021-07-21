import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Typography } from '@material-ui/core'
import { Title } from '../../components/Title'
import { NotificationMode } from './NotificationsMode'

interface State {
  loading: boolean
  error?: string
  notificationUrl?: string
  notificationEmail: boolean
}

export const NotificationsPage: React.FC = () => {
  const {
    notificationUrl,
    notificationEmail,
    notificationSystem,
  } = useSelector((state: ApplicationState) => ({
    notificationUrl: state.auth?.user?.metadata?.portalUrl,
    notificationEmail: state.auth?.user?.metadata?.notificationEmail,
    notificationSystem: state.auth?.user?.metadata?.notificationSystem,
    preferences: state.backend.preferences,
  }))
  console.log({ notificationSystem })
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth

  const [url, setUrl] = useState<string>(notificationUrl || '')
  const [email, setEmail] = useState<boolean>(notificationEmail || false)
  const [system, setSystem] = useState<boolean>(notificationSystem || false)

  const onUpdate = (metadata: IMetadata) => {
    updateUserMetadata(metadata)
  }

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Notifications</Title>
        </Typography>
      }
    >

      <Typography variant="subtitle1">Delivery Method</Typography>
      <NotificationMode
        setUrl={setUrl}
        setEmailChecked={setEmail}
        setSystemChecked={setSystem}
        notificationUrl={url}
        notificationEmail={email}
        notificationSystem={system}
        onUpdate={onUpdate}
      />
    </Container>
  )
}

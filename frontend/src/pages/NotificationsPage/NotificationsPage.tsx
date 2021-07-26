import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { Typography } from '@material-ui/core'
import { Title } from '../../components/Title'
import { NotificationMode } from './NotificationsMode'

export const NotificationsPage: React.FC = () => {
  const {
    notificationUrl,
    emailNotifications,
    desktopNotifications,
  } = useSelector((state: ApplicationState) =>  state.auth.notificationSettings)
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth

  const [url, setUrl] = useState<string>(notificationUrl || '')
  const [email, setEmail] = useState<boolean>(emailNotifications || false)
  const [system, setSystem] = useState<boolean>(desktopNotifications || false)

  const onUpdate = (metadata: INotificationSetting) => {
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
        emailNotifications={email}
        desktopNotifications={system}
        onUpdate={onUpdate}
      />
    </Container>
  )
}

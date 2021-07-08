import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { List, ListItem, ListItemIcon, Typography, Divider } from '@material-ui/core'
import { Title } from '../../components/Title'
import { Quote } from '../../components/Quote'
import { NotificationMode } from './NotificationsMode'
import { ListItemSetting } from '../../components/ListItemSetting'

interface State {
  onlineDeviceNotification: boolean
  onlineSharedDeviceNotification: boolean
  loading: boolean
  error?: string
  notificationUrl?: string
  notificationEmail: boolean
}

export const NotificationsPage: React.FC = () => {
  const {
    onlineDeviceNotification,
    onlineSharedDeviceNotification,
    notificationUrl,
    notificationEmail,
    notificationSystem,
  } = useSelector((state: ApplicationState) => ({
    onlineDeviceNotification: state.auth?.user?.metadata?.onlineDeviceNotification,
    onlineSharedDeviceNotification: state.auth?.user?.metadata?.onlineSharedDeviceNotification,
    notificationUrl: state.auth?.user?.metadata?.portalUrl,
    notificationEmail: state.auth?.user?.metadata?.notificationEmail,
    notificationSystem: state.auth?.user?.metadata?.notificationSystem,
    preferences: state.backend.preferences,
  }))
  console.log({ notificationSystem })
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth

  const [sharedNotification, setSharedNotification] = useState(onlineSharedDeviceNotification || false)
  const [deviceNotification, setDeviceNotification] = useState(onlineDeviceNotification || false)
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
      <List>
        <ListItemSetting
          label="For my devices"
          icon={deviceNotification ? 'bell' : 'bell-slash'}
          toggle={deviceNotification}
          onClick={() => setDeviceNotification(!deviceNotification)}
        />
        <ListItemSetting
          label="For devices shared with me"
          icon={sharedNotification ? 'bell' : 'bell-slash'}
          toggle={sharedNotification}
          onClick={() => setSharedNotification(!sharedNotification)}
        />
        <ListItem>
          <ListItemIcon></ListItemIcon>
          <Quote margin={0}>
            <Typography variant="caption">Method</Typography>
            <NotificationMode
              onlineDeviceNotification={deviceNotification}
              onlineSharedDeviceNotification={sharedNotification}
              setUrl={setUrl}
              setEmailChecked={setEmail}
              setSystemChecked={setSystem}
              notificationUrl={url}
              notificationEmail={email}
              notificationSystem={system}
              onUpdate={onUpdate}
            />
          </Quote>
        </ListItem>
      </List>
    </Container>
  )
}

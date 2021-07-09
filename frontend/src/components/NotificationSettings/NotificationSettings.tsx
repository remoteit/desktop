import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import {
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Switch,
  Typography,
  Tooltip,
} from '@material-ui/core'
import { ListItemSetting } from '../../components/ListItemSetting'
import { Title } from '../Title'
import { Icon } from '../Icon'

type Props = {
  device: IDevice
}

enum notificationType {
  'OWN' = 'onlineDeviceNotification',
  'DEVICE_SHARED' = 'onlineSharedDeviceNotification',
  'EMAIL' = 'notificationEmail',
}

export const NotificationSettings: React.FC<Props> = ({ device }) => {
  const isOwner = !device.shared
  const { devices } = useDispatch<Dispatch>()
  const { globalNotificationEmail, globalNotificationSystem } = useSelector((state: ApplicationState) => ({
    globalNotificationEmail: state.auth?.user?.metadata?.notificationEmail,
    globalNotificationSystem: state.auth?.user?.metadata?.notificationSystem
  }))
  const [emailNotification, setEmailNotification] = useState(
    device.attributes.notificationEmail
  )
  const [notificationInApp, setNotificationInApp] = useState(
    isOwner ? device.attributes.onlineDeviceNotification : device.attributes.onlineSharedDeviceNotification || false
  )
  const [overridden, setOverridden] = useState(
    globalNotificationSystem !==
    (isOwner ? device.attributes.onlineDeviceNotification : device.attributes.onlineSharedDeviceNotification || false)
  )
  const [emailOverridden, setEmailOverridden] = useState(
    globalNotificationEmail !== emailNotification
  )

  const emailNotifications = () => {
    device.attributes = {
      ...device.attributes,
      [notificationType.EMAIL]: !emailNotification,
    }
    devices.setAttributes(device)
    setEmailNotification(!emailNotification)
  }

  const inAppNotifications = () => {
    let notification = isOwner ? notificationType.OWN : notificationType.DEVICE_SHARED
    device.attributes = {
      ...device.attributes,
      [notification]: !notificationInApp,
    }
    devices.setAttributes(device)
    setNotificationInApp(!notificationInApp)
  }
  const onClose = (system: boolean) => {
    let notification = isOwner ? notificationType.OWN : notificationType.DEVICE_SHARED
    if (system) {
      setOverridden(false)
      setNotificationInApp(globalNotificationSystem)
    } else {
      setEmailOverridden(false)
      setEmailNotification(globalNotificationEmail)
      notification = notificationType.EMAIL
    }

    device.attributes = {
      ...device.attributes,
      [notification]: system ? globalNotificationSystem : globalNotificationEmail,
    }
    devices.setAttributes(device)
  }

  const chipOverridden = (system: boolean = true) => {
    return (
      <Chip
        label="Overridden"
        size="small"
        deleteIcon={
          <IconButton>
            <Icon name="times" size="xs" />
          </IconButton>
        }
        onDelete={() => onClose(system)}
      ></Chip>
    )
  }

  if (!device) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title>Notification overrides</Title>
        <Tooltip title="Global Settings">
          <IconButton to="/settings/notifications" component={Link}>
            <Icon name="ellipsis-h" size="md" />
          </IconButton>
        </Tooltip>
      </Typography>
      <List>
        <ListItem button onClick={inAppNotifications} dense>
          <ListItemIcon>
            <Icon name={notificationInApp ? 'bell' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="System notification" />
          <ListItemSecondaryAction>
            {overridden && chipOverridden()}
            <Switch edge="end" color="primary" checked={!!notificationInApp} onClick={inAppNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem button onClick={emailNotifications} dense>
          <ListItemIcon>
            <Icon name={emailNotification ? 'bell' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="Email" />
          <ListItemSecondaryAction>
            {emailOverridden && chipOverridden(false)}
            <Switch edge="end" color="primary" checked={!!emailNotification} onClick={emailNotifications} />
          </ListItemSecondaryAction>
        </ListItem>

      </List>
    </>
  )
}

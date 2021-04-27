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
  const { globalNotificationEmail } = useSelector((state: ApplicationState) => ({
    globalNotificationEmail: state.auth?.user?.metadata?.notificationEmail,
  }))
  const [emailNotification, setEmailNotification] = useState(
    device.attributes.notificationEmail || globalNotificationEmail
  )
  const [notificationInApp, setNotificationInApp] = useState(
    isOwner ? device.attributes.onlineDeviceNotification : device.attributes.onlineSharedDeviceNotification || false
  )
  const [overridden, setOverridden] = useState(
    globalNotificationEmail !==
      (isOwner ? device.attributes.onlineDeviceNotification : device.attributes.onlineSharedDeviceNotification || false)
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
  const handleClose = () => {
    setOverridden(false)
    let notification = isOwner ? notificationType.OWN : notificationType.DEVICE_SHARED
    device.attributes = {
      ...device.attributes,
      [notification]: globalNotificationEmail,
    }
    devices.setAttributes(device)
    setNotificationInApp(globalNotificationEmail)
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
            {overridden && (
              <Chip
                label="Overridden"
                size="small"
                deleteIcon={
                  <IconButton>
                    <Icon name="times" size="xs" />
                  </IconButton>
                }
                onDelete={handleClose}
              ></Chip>
            )}
            <Switch edge="end" color="primary" checked={!!notificationInApp} onClick={inAppNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItemSetting
          label="Email"
          icon={emailNotification ? 'bell' : 'bell-slash'}
          toggle={!!emailNotification}
          onClick={emailNotifications}
          quote={false}
        />
      </List>
    </>
  )
}

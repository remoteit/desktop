import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import {
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
} from '@material-ui/core'
import { IconButton } from '../../buttons/IconButton'
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
    globalNotificationSystem: state.auth?.user?.metadata?.notificationSystem,
  }))
  const [emailNotification, setEmailNotification] = useState<boolean | undefined>(undefined)
  const [notificationInApp, setNotificationInApp] = useState<boolean | undefined>(undefined)
  const [overridden, setOverridden] = useState<boolean>()
  const [emailOverridden, setEmailOverridden] = useState<boolean>()

  useEffect(() => {
    setNotificationInApp(
      isOwner ? device.attributes.onlineDeviceNotification : device.attributes.onlineSharedDeviceNotification
    )
    setEmailNotification(device.attributes.notificationEmail)
  }, [isOwner, device?.attributes])

  useEffect(() => {
    console.log({ notificationInApp }, typeof notificationInApp)
    setOverridden(typeof notificationInApp === "boolean")
  }, [notificationInApp])

  useEffect(() => {
    console.log({ emailNotification })
    setEmailOverridden(typeof emailNotification === "boolean")
  }, [emailNotification])

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
      setNotificationInApp(undefined)
    } else {
      setEmailOverridden(false)
      setEmailNotification(undefined)
      notification = notificationType.EMAIL
    }

    devices.setAttributes({
      ...device,
      attributes: {
        ...device.attributes,
        [notification]: null
      }
    })
  }

  const chipOverridden = (system: boolean = true) => {
    return (
      <Chip
        label="Overridden"
        size="small"
        deleteIcon={<IconButton icon="times" size="xs" />}
        onDelete={() => onClose(system)}
      ></Chip>
    )
  }

  if (!device) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title>Notification overrides</Title>
        <IconButton
          title="Global Settings"
          to="/settings/notifications"
          icon="sliders-h"
          color="grayDark"
          size="sm"
          shiftDown
        />
      </Typography>
      <List>
        <ListItem button onClick={inAppNotifications} dense>
          <ListItemIcon>
            <Icon name={notificationInApp ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="System notification" />
          <ListItemSecondaryAction>
            {overridden && chipOverridden()}
            <Switch edge="end" color="primary" checked={typeof notificationInApp === "boolean" ? !!notificationInApp : globalNotificationSystem} onClick={inAppNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem button onClick={emailNotifications} dense>
          <ListItemIcon>
            <Icon name={emailNotification ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="Email" />
          <ListItemSecondaryAction>
            {emailOverridden && chipOverridden(false)}
            <Switch edge="end" color="primary" checked={typeof emailNotification === "boolean" ? !!emailNotification : globalNotificationEmail} onClick={emailNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </>
  )
}

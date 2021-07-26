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


export const NotificationSettings: React.FC<Props> = ({ device }) => {
  const { devices } = useDispatch<Dispatch>()
  const { globalNotificationEmail, globalNotificationSystem } = useSelector((state: ApplicationState) => ({
    globalNotificationEmail: state.auth?.notificationSettings?.emailNotifications,
    globalNotificationSystem: state.auth?.notificationSettings?.desktopNotifications,
  }))
  const [emailNotification, setEmailNotification] = useState<boolean | undefined | null>(device?.notificationSettings?.emailNotifications)
  const [notificationInApp, setNotificationInApp] = useState<boolean | undefined | null>(device?.notificationSettings?.desktopNotifications)
  const [overridden, setOverridden] = useState<boolean>()
  const [emailOverridden, setEmailOverridden] = useState<boolean>()


  useEffect(() => {
    setOverridden(typeof notificationInApp === "boolean")
  }, [notificationInApp])

  useEffect(() => {
    setEmailOverridden(typeof emailNotification === "boolean")
  }, [emailNotification])

  const handleEmailNotifications = () => {
    devices.setNotificationDevice({
      ...device,
      notificationSettings: {
        ...device.notificationSettings,
        emailNotifications: !emailNotification
      }
    })
    setEmailNotification(!emailNotification)
  }

  const handleInAppNotifications = () => {
    devices.setNotificationDevice({
      ...device,
      notificationSettings: {
        ...device.notificationSettings,
        desktopNotifications: !notificationInApp
      }
    })
    setNotificationInApp(!notificationInApp)
  }

  const onClose = (system: boolean) => {
    if (system) {
      setOverridden(false)
      setNotificationInApp(undefined)
      devices.setNotificationDevice({
        ...device,
        notificationSettings: {
          desktopNotifications: null
        }
      })

    } else {
      setEmailOverridden(false)
      setEmailNotification(undefined)
      devices.setNotificationDevice({
        ...device,
        notificationSettings: {
          emailNotifications: null
        }
      })
    }

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
        <ListItem button onClick={handleInAppNotifications} dense>
          <ListItemIcon>
            <Icon name={notificationInApp ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="System notification" />
          <ListItemSecondaryAction>
            {overridden && chipOverridden()}
            <Switch edge="end" color="primary" checked={overridden ? notificationInApp || false : globalNotificationSystem} onClick={handleInAppNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem button onClick={handleEmailNotifications} dense>
          <ListItemIcon>
            <Icon name={emailNotification ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary="Email" />
          <ListItemSecondaryAction>
            {emailOverridden && chipOverridden(false)}
            <Switch edge="end" color="primary" checked={emailOverridden ? emailNotification || false : globalNotificationEmail} onClick={handleEmailNotifications} />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </>
  )
}

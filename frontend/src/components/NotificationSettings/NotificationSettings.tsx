import React, { useEffect, useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import {
  Chip,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { ListItemSetting } from '../ListItemSetting'
import { PushCategoryList } from '../PushCategoryList'
import { Title } from '../Title'
import { Icon } from '../Icon'
import { DEFAULT_PUSH_CATEGORIES, DEVICE_PUSH_CATEGORIES } from '../../constants'
import browser from '../../services/browser'

export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const { devices } = useDispatch<Dispatch>()
  const globalNotificationEmail = useSelector((state: State) => state.user.notificationSettings?.emailNotifications)
  const globalNotificationSystem = useSelector((state: State) => state.user.notificationSettings?.desktopNotifications)
  const globalPushNotifications = useSelector((state: State) => state.user.notificationSettings?.pushNotifications)
  const globalPushCategories = useSelector((state: State) => state.user.notificationSettings?.pushCategories)
  const [emailNotification, setEmailNotification] = useState<boolean | undefined | null>(
    device?.notificationSettings?.emailNotifications
  )
  const [inAppNotification, setInAppNotification] = useState<boolean | undefined | null>(
    device?.notificationSettings?.desktopNotifications
  )
  const [inAppOverridden, setInAppOverridden] = useState<boolean>()
  const [emailOverridden, setEmailOverridden] = useState<boolean>()

  useEffect(() => {
    setInAppOverridden(typeof inAppNotification === 'boolean')
  }, [inAppNotification])

  useEffect(() => {
    setEmailOverridden(typeof emailNotification === 'boolean')
  }, [emailNotification])

  if (!device) return null // TODO refactor and make undefined check in devicerouter

  const saveSettings = (settings: IDevice['notificationSettings']) =>
    devices.setNotificationDevice({ device, settings })

  const handleEmailNotifications = async () => {
    const currentEmailNotification = emailOverridden ? emailNotification || false : globalNotificationEmail
    setEmailNotification(!currentEmailNotification)
    await saveSettings({ emailNotifications: !currentEmailNotification })
  }

  const handleInAppNotifications = async () => {
    const currentDesktopNotification = inAppOverridden ? inAppNotification || false : globalNotificationSystem
    setInAppNotification(!currentDesktopNotification)
    await saveSettings({ desktopNotifications: !currentDesktopNotification })
  }

  const pushOverride = device.notificationSettings?.pushCategories
  const pushEnabled = (pushOverride ?? globalPushCategories ?? DEFAULT_PUSH_CATEGORIES).filter(category =>
    DEVICE_PUSH_CATEGORIES.includes(category)
  )
  const pushOn = (device.notificationSettings?.pushNotifications ?? globalPushNotifications) !== false

  const onClose = (value: string) => {
    switch (value) {
      case 'inapp':
        setInAppOverridden(false)
        setInAppNotification(undefined)
        saveSettings({ desktopNotifications: null })
        break

      case 'email':
        setEmailOverridden(false)
        setEmailNotification(undefined)
        saveSettings({ emailNotifications: null })
        break

      case 'push':
        saveSettings({ pushCategories: null })
        break
    }
  }

  const chipOverridden = (value: string = 'inapp') => {
    return (
      <Chip
        label={t('notificationSettings.custom', 'Custom')}
        size="small"
        deleteIcon={<IconButton icon="times" size="xs" buttonBaseSize="small" />}
        onDelete={() => onClose(value)}
      />
    )
  }

  if (!device) return null

  const inapp = inAppOverridden ? inAppNotification || false : globalNotificationSystem
  const email = emailOverridden ? emailNotification || false : globalNotificationEmail

  return (
    <>
      <Typography variant="subtitle1">
        <Title>{t('notificationSettings.title', 'Device Notifications')}</Title>
        <IconButton
          title={t('notificationSettings.globalSettings', 'Global Settings')}
          to="/settings/notifications"
          icon="sliders-h"
          color="grayDark"
          size="sm"
          shiftDown
        />
      </Typography>
      <List>
        {!browser.isMobile && (
          <ListItemButton onClick={handleInAppNotifications} dense>
            <ListItemIcon>
              <Icon name={inapp ? 'bell-on' : 'bell-slash'} size="md" />
            </ListItemIcon>
            <ListItemText primary={t('notificationSettings.systemNotification', 'System notification')} />
            <ListItemSecondaryAction>
              {inAppOverridden && chipOverridden('inapp')}
              <Switch edge="end" color="primary" checked={inapp} onClick={handleInAppNotifications} />
            </ListItemSecondaryAction>
          </ListItemButton>
        )}
        <ListItemSetting
          icon={pushOn && pushEnabled.length ? 'bell-on' : 'bell-slash'}
          label={t('notificationSettings.push', 'Mobile push')}
          secondaryContent={pushOverride ? chipOverridden('push') : undefined}
          secondaryContentWidth="100px"
        />
        <PushCategoryList
          categories={DEVICE_PUSH_CATEGORIES}
          enabled={pushEnabled}
          disabled={!pushOn}
          onChange={pushCategories => saveSettings({ pushCategories })}
        />
        <ListItemButton onClick={handleEmailNotifications} dense>
          <ListItemIcon>
            <Icon name={email ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary={t('notificationSettings.email', 'Email')} />
          <ListItemSecondaryAction>
            {emailOverridden && chipOverridden('email')}
            <Switch edge="end" color="primary" checked={email} onClick={handleEmailNotifications} />
          </ListItemSecondaryAction>
        </ListItemButton>
      </List>
    </>
  )
}

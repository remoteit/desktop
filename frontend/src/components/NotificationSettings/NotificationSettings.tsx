import React, { useEffect, useState, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../../services/Context'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import {
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { ListItemSetting } from '../ListItemSetting'
import { Title } from '../Title'
import { Icon } from '../Icon'
import { DEFAULT_PUSH_CATEGORIES, DEVICE_PUSH_CATEGORIES } from '../../constants'
import { usePushCategoryLabels } from '../../hooks/usePushCategoryLabels'
import browser from '../../services/browser'

export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const { devices } = useDispatch<Dispatch>()
  const globalNotificationEmail = useSelector((state: State) => state.user.notificationSettings?.emailNotifications)
  const globalNotificationSystem = useSelector((state: State) => state.user.notificationSettings?.desktopNotifications)
  const globalPushNotifications = useSelector((state: State) => state.user.notificationSettings?.pushNotifications)
  const globalPushCategories = useSelector((state: State) => state.user.notificationSettings?.pushCategories)
  const pushCategoryLabels = usePushCategoryLabels()
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

  const handleEmailNotifications = async () => {
    const currentEmailNotification = emailOverridden ? emailNotification || false : globalNotificationEmail
    setEmailNotification(!currentEmailNotification)
    const item = {
      ...device,
      notificationSettings: {
        ...device.notificationSettings,
        emailNotifications: !currentEmailNotification,
      },
    }
    await devices.setNotificationDevice(item)
  }

  const handleInAppNotifications = async () => {
    const currentDesktopNotification = inAppOverridden ? inAppNotification || false : globalNotificationSystem
    setInAppNotification(!currentDesktopNotification)
    const item = {
      ...device,
      notificationSettings: {
        ...device.notificationSettings,
        desktopNotifications: !currentDesktopNotification,
      },
    }
    await devices.setNotificationDevice(item)
  }

  const pushOverride = device.notificationSettings?.pushCategories
  const pushEnabled = (pushOverride ?? globalPushCategories ?? DEFAULT_PUSH_CATEGORIES).filter(category =>
    DEVICE_PUSH_CATEGORIES.includes(category)
  )
  const pushOn = globalPushNotifications !== false

  const setPushCategories = (pushCategories: IPushCategory[] | null) =>
    devices.setNotificationDevice({
      ...device,
      notificationSettings: { ...device.notificationSettings, pushCategories },
    })

  const handlePushCategory = (category: IPushCategory) =>
    setPushCategories(
      pushEnabled.includes(category) ? pushEnabled.filter(c => c !== category) : [...pushEnabled, category]
    )

  const onClose = (value: string) => {
    switch (value) {
      case 'inapp':
        setInAppOverridden(false)
        setInAppNotification(undefined)
        const itemInApp = {
          ...device,
          notificationSettings: {
            ...device.notificationSettings,
            desktopNotifications: null,
          },
        }
        devices.setNotificationDevice(itemInApp)
        break

      case 'email':
        setEmailOverridden(false)
        setEmailNotification(undefined)
        const itemEmail = {
          ...device,
          notificationSettings: {
            ...device.notificationSettings,
            emailNotifications: null,
          },
        }
        devices.setNotificationDevice(itemEmail)
        break

      case 'push':
        setPushCategories(null)
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
        <ListItem dense>
          <ListItemIcon>
            <Icon name={pushOn && pushEnabled.length ? 'bell-on' : 'bell-slash'} size="md" />
          </ListItemIcon>
          <ListItemText primary={t('notificationSettings.push', 'Mobile push')} />
          <ListItemSecondaryAction>{pushOverride && chipOverridden('push')}</ListItemSecondaryAction>
        </ListItem>
        {DEVICE_PUSH_CATEGORIES.map(category => (
          <ListItemSetting
            key={category}
            quote
            label={pushCategoryLabels[category]}
            toggle={pushEnabled.includes(category)}
            disabled={!pushOn}
            onClick={() => handlePushCategory(category)}
          />
        ))}
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

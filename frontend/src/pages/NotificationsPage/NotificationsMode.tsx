import React, { useState, useEffect } from 'react'
import { TextField, Button, List } from '@material-ui/core'
import { Gutters } from '../../components/Gutters'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Quote } from '../../components/Quote'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { isWebUri } from 'valid-url'

export const NotificationMode: React.FC = () => {
  const {
    notificationUrl = '',
    urlNotifications = false,
    emailNotifications = false,
    desktopNotifications = false,
  } = useSelector((state: ApplicationState) => state.user.notificationSettings)
  const dispatch = useDispatch<Dispatch>()
  const { updateNotificationSettings } = dispatch.user
  const [webHookUrl, setWebhookUrl] = useState(notificationUrl)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState(false)
  const changed = webHookUrl !== notificationUrl
  const metadata: INotificationSetting = {
    desktopNotifications: desktopNotifications,
    emailNotifications: emailNotifications,
    urlNotifications: urlNotifications,
    notificationUrl: webHookUrl,
  }

  useEffect(() => {
    setWebhookUrl(notificationUrl)
  }, [notificationUrl])

  const onEmailChange = (value: boolean) => {
    updateNotificationSettings({ ...metadata, emailNotifications: value })
  }

  const onSystemChange = (value: boolean) => {
    updateNotificationSettings({ ...metadata, desktopNotifications: value })
  }

  const onWebChange = (value: boolean) => {
    setWebhookUrl('')
    setError(false)
    updateNotificationSettings({
      ...metadata,
      notificationUrl: '',
      urlNotifications: value,
    })
  }

  const changeWebHookUrl = (value: string) => {
    setWebhookUrl(value)
    if (urlNotifications) {
      isWebUri(value) ? setError(false) : setError(true)
    }
  }

  const onSave = async () => {
    if (!error) {
      setLoading(true)
      await updateNotificationSettings({
        ...metadata,
        notificationUrl: urlNotifications && webHookUrl?.length ? webHookUrl : '',
        urlNotifications: urlNotifications,
      })
      setLoading(false)
    }
  }

  return (
    <>
      <List>
        <ListItemSwitch label="System notification" checked={desktopNotifications} onClick={onSystemChange} />
        <ListItemSwitch label="Email" checked={emailNotifications} onClick={onEmailChange} />
        <ListItemSwitch label="Webhook" checked={urlNotifications} onClick={onWebChange} />
      </List>
      <Gutters inset="icon" top={null}>
        <Quote margin={null}>
          <TextField
            disabled={!urlNotifications}
            onChange={e => changeWebHookUrl(e.currentTarget.value.trim())}
            value={webHookUrl}
            label="URL endpoint"
            placeholder="Webhook Endpoint"
            required
            variant="filled"
            error={error}
            fullWidth
            helperText={error ? 'Please provide a valid URL' : undefined}
          />
          <br />
          <br />
          <Button
            variant="contained"
            color="primary"
            onClick={onSave}
            disabled={error || loading || !changed}
            size="small"
          >
            {loading ? 'Saving' : 'Save'}
          </Button>
        </Quote>
      </Gutters>
    </>
  )
}

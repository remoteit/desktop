import React, { useState, useEffect } from 'react'
import { TextField, Button, List, Typography, Box } from '@mui/material'
import { Gutters } from '../../components/Gutters'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Link } from '../../components/Link'
import { Quote } from '../../components/Quote'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import isURL from 'validator/lib/isURL'

export const NotificationMode: React.FC = () => {
  const { notificationUrl, urlNotifications, emailNotifications, desktopNotifications } = useSelector(
    (state: State) => state.user.notificationSettings
  )
  const dispatch = useDispatch<Dispatch>()
  const { updateNotificationSettings } = dispatch.user
  const [webHookUrl, setWebhookUrl] = useState<string>(notificationUrl || '')
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
    setWebhookUrl(notificationUrl || '')
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
      isURL(value) ? setError(false) : setError(true)
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
            placeholder="https://example.com/webhooks/remoteit"
            required
            variant="filled"
            error={error}
            fullWidth
            helperText={error ? 'Please provide a valid URL' : undefined}
          />
          <Typography variant="caption" color="text.secondary" component="p" marginTop={2} marginBottom={1}>
            Use a public HTTPS URL. Endpoint must accept POST and return 200 within 5 seconds.{' '}
            <Link href="https://docs.remote.it/developer-tools/webhooks">Docs</Link>
          </Typography>
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

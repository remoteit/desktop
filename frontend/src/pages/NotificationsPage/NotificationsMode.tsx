import React, { useState, useEffect } from 'react'
import { TextField, Button, List } from '@material-ui/core'
import { Gutters } from '../../components/Gutters'
import { REGEX_VALID_URL } from '../../shared/constants'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Quote } from '../../components/Quote'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { isWebUri } from 'valid-url'

export const NotificationMode: React.FC = () => {
  const { notificationUrl = '', urlNotifications = false, emailNotifications = false, desktopNotifications } = useSelector(
    (state: ApplicationState) => state.auth.notificationSettings
  )
  const { appRefreshed = false } = useSelector(
    (state: ApplicationState) => state.ui
  )
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth
  const [email, setEmail] = useState<boolean>(emailNotifications)
  const [system, setSystem] = useState<boolean>(false)
  const [webHook, setWebhook] = useState<boolean>(urlNotifications)
  const [webHookUrl, setWebhookUrl] = useState(notificationUrl)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState(false)
  const changed = webHookUrl !== notificationUrl
  const metadata: INotificationSetting = {
    desktopNotifications: system,
    emailNotifications: email,
    urlNotifications: webHook,
    notificationUrl: webHookUrl,
  }

  useEffect(() => {
    if (appRefreshed) {
      if (email !== emailNotifications) {
        setEmail(emailNotifications)
      }
      if (webHook !== urlNotifications) {
        setWebhook(urlNotifications)
      }
      if (webHookUrl !== notificationUrl) {
        setWebhookUrl(notificationUrl)
      }
      dispatch.ui.set({ appRefreshed: false })
    }
  })

  useEffect(() => {
    setEmail(emailNotifications)
  }, [emailNotifications]);

  useEffect(() => {
    setWebhook(urlNotifications)
  }, [urlNotifications]);

  useEffect(() => {
    setWebhookUrl(notificationUrl)
  }, [notificationUrl]);

  const onEmailChange = (value: boolean) => {
    setEmail(value)
    updateUserMetadata({ ...metadata, emailNotifications: value })
  }

  const onSystemChange = (value: boolean) => {
    setSystem(value)
    updateUserMetadata({ ...metadata, desktopNotifications: value })
  }

  const onWebChange = (value: boolean) => {
    setWebhook(value)
    setWebhookUrl('')
    setError(false)
  }

  const checkWebHookUrl = (value: string) => {
    setWebhookUrl(value)
    if (webHook) {
      isWebUri(value) ? setError(false) : setError(true)
      // setError(!REGEX_VALID_URL.test(value))
    }
  }

  const onSave = async () => {
    if (!error) {
      setLoading(true)
      await updateUserMetadata({
        ...metadata,
        notificationUrl: webHook && webHookUrl?.length ? webHookUrl : '',
        urlNotifications: webHook,
      })
      setLoading(false)
    }
  }

  React.useEffect(() => {
    checkWebHookUrl(webHookUrl)
  }, [])

  return (
    <>
      <List>
        <ListItemSwitch label="System notification" checked={system} onClick={onSystemChange} />
        <ListItemSwitch label="Email" checked={email} onClick={onEmailChange} />
        <ListItemSwitch label="Webhook" checked={webHook} onClick={onWebChange} />
      </List>
      <Gutters inset="icon" top={null}>
        <Quote margin={0}>
          <TextField
            disabled={!webHook}
            onChange={e => checkWebHookUrl(e.currentTarget.value.trim())}
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
            disabled={error || loading || !changed || !webHook}
            size="small"
          >
            {loading ? 'Saving' : 'Save'}
          </Button>
        </Quote>
      </Gutters>
    </>
  )
}

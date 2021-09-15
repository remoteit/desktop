import React, { useState } from 'react'
import { TextField, Button, List } from '@material-ui/core'
import { Gutters } from '../../components/Gutters'
import { REGEX_VALID_URL } from '../../shared/constants'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Quote } from '../../components/Quote'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'

export const NotificationMode: React.FC = () => {
  const { notificationUrl, urlNotifications, emailNotifications, desktopNotifications } = useSelector(
    (state: ApplicationState) => state.auth.notificationSettings
  )
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth
  const [email, setEmail] = useState<boolean>(emailNotifications || false)
  const [system, setSystem] = useState<boolean>(desktopNotifications || false)
  const [webHook, setWebhook] = useState<boolean | undefined>(urlNotifications)
  const [webHookUrl, setWebhookUrl] = useState(notificationUrl || '')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState(false)
  const changed = webHookUrl !== notificationUrl
  const metadata: INotificationSetting = {
    desktopNotifications: system,
    emailNotifications: email,
    urlNotifications: webHook,
    notificationUrl: webHookUrl,
  }

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
  }

  const checkWebHookUrl = (value: string) => {
    setWebhookUrl(value)
    if (webHook) setError(!REGEX_VALID_URL.test(value))
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
            size="small"
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

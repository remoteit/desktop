import React, { useState } from 'react'
import { TextField, List } from '@material-ui/core'
import { Gutters } from '../../components/Gutters'
import { REGEX_VALID_URL } from '../../shared/constants'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Quote } from '../../components/Quote'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'

export function NotificationMode(): JSX.Element {

  const {
    notificationUrl,
    urlNotifications,
    emailNotifications,
    desktopNotifications,
  } = useSelector((state: ApplicationState) => state.auth.notificationSettings)
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth
  const [email, setEmail] = useState<boolean>(emailNotifications || false)
  const [system, setSystem] = useState<boolean>(desktopNotifications || false)

  const [webHook, setWebhook] = useState<boolean | undefined>(urlNotifications)
  const [webHookUrl, setWebhookUrl] = useState(notificationUrl || '')
  const [error, setError] = useState(false)
  const metadata: INotificationSetting = {
    desktopNotifications: system,
    emailNotifications: email,
    urlNotifications: webHook,
    notificationUrl: webHookUrl
  }

  const onEmailChange = (value: boolean) => {
    setEmail(value)
    updateUserMetadata({ ...metadata, emailNotifications: value })
    setError(false)
  }

  const onSystemChange = (value: boolean) => {
    setSystem(value)
    updateUserMetadata({ ...metadata, desktopNotifications: value })
    setError(false)
  }

  const onWebChange = (value: boolean) => {
    setWebhook(value)
    setWebhookUrl('')
    if (!value) {
      updateUserMetadata({
        ...metadata,
        notificationUrl: '',
        urlNotifications: false
      })
    }
    setError(false)
  }

  const onChange = (value: string) => {
    if (value === webHookUrl) return
    setWebhookUrl(value)
    if (!REGEX_VALID_URL.test(value) && /\s/.test(value) && value.length > 10) {
      setError(true)
    } else {
      setError(false)
      updateUserMetadata({
        ...metadata,
        notificationUrl: webHook && webHookUrl?.length ? webHookUrl : '',
        urlNotifications: webHook
      })
    }
  }

  return (
    <>
      <List>
        <ListItemSwitch label='System notification' checked={system} onClick={onSystemChange} />
        <ListItemSwitch label='Email' checked={email} onClick={onEmailChange} />
        <ListItemSwitch label="Webhook" checked={webHook} onClick={onWebChange} />
      </List>
      <Gutters inset noTop>
        <Quote margin={0}>
          <TextField
            disabled={!webHook}
            onChange={e => onChange(e.currentTarget.value?.trim())}
            onBlur={e => onChange(e.currentTarget.value?.trim())}
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
        </Quote>
      </Gutters>
      <Gutters>

      </Gutters>
    </>
  )
}

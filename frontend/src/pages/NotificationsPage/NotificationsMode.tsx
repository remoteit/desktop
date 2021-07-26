import React, { useState } from 'react'
import { TextField, Button, List } from '@material-ui/core'
import { ListItemCheckbox } from '../../components/ListItemCheckbox'
import { Quote } from '../../components/Quote'
import { Gutters } from '../../components/Gutters'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { REGEX_VALID_URL } from '../../shared/constants'

export function NotificationMode({ ...props }): JSX.Element {
  const [webHook, setWebhook] = useState<boolean>(props.urlNotifications)
  const [webHookUrl, setWebhookUrl] = useState(props.notificationUrl)
  const [error, setError] = useState(false)
  const [errorFlag, setErrorFlag] = useState(false)
  const { loading } = useSelector((state: ApplicationState) => ({
    loading: state.auth?.loading,
  }))

  const onEmailChange = (value: boolean) => {
    props.setEmailChecked(value)
    setError(false)
  }

  const onSystemChange = (value: boolean) => {
    props.setSystemChecked(value)
    setError(false)
  }

  const onWebChange = (value: boolean) => {
    setWebhook(value)
    setWebhookUrl('')
    setError(false)
  }

  const onChange = value => {
    setWebhookUrl(value)
    REGEX_VALID_URL.test(value) ? setError(false) : setError(true)
  }

  const onSave = async () => {
    if (errorFlag) {
      setError(true)
    } else {
      const metadata: INotificationSetting = {
        notificationUrl: webHook && webHookUrl?.length ? webHookUrl : '',
        emailNotifications: props.emailNotifications,
        desktopNotifications: props.desktopNotifications,
        urlNotifications: webHook
      }
      props.onUpdate(metadata)
    }
  }

  return (
    <>
      <List>
        <ListItemCheckbox label="System notification" checked={props.desktopNotifications} onClick={onSystemChange} />
        <ListItemCheckbox label="Email" checked={props.emailNotifications} onClick={onEmailChange} />
        <ListItemCheckbox label="Webhook" checked={webHook} onClick={onWebChange} />
      </List>
      <Gutters inset noTop>
        <Quote margin={0}>
          <TextField
            disabled={!webHook}
            onChange={e => onChange(e.currentTarget.value)}
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
        <Button variant="contained" color="primary" onClick={onSave} disabled={loading} size="small">
          {loading ? 'Saving' : 'Save'}
        </Button>
      </Gutters>
    </>
  )
}

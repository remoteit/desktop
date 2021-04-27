import React, { useState, useEffect } from 'react'
import { TextField, Button, List, ListItemSecondaryAction } from '@material-ui/core'
import { ListItemCheckbox } from '../../components/ListItemCheckbox'
import { REGEX_VALID_URL } from '../../shared/constants'

const is_url = str => {
  if (str.length === 0) return false
  return REGEX_VALID_URL.test(str) ? true : false
}

export function NotificationMode({ ...props }): JSX.Element {
  const [webHook, setWebhook] = useState(props.notificationUrl.length ? true : false)
  const [webHookUrl, setWebhookUrl] = useState(props.notificationUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorFlag, setErrorFlag] = useState(false)
  const [panelDisable, setPanelDisable] = useState(false)

  useEffect(() => {
    !props.onlineDeviceNotification && !props.onlineSharedDeviceNotification
      ? setPanelDisable(true)
      : setPanelDisable(false)
  }, [props.onlineDeviceNotification, props.onlineSharedDeviceNotification])

  const handleEmailChange = (value: boolean) => {
    props.setEmailChecked(value)
    setError(false)
  }

  const handleSystemChange = (value: boolean) => {
    props.setSystemChecked(value)
    setError(false)
  }

  const handleWebChange = (value: boolean) => {
    setWebhook(value)
    setWebhookUrl('')
    setError(false)
    value ? setErrorFlag(true) : setErrorFlag(false)
  }

  const handleChange = value => {
    setWebhookUrl(value)
    setError(false)
  }

  const handleSave = async () => {
    setLoading(true)
    if (errorFlag) {
      setError(true)
      setLoading(false)
    } else {
      const metadata: IMetadata = {
        onlineDeviceNotification: props.onlineDeviceNotification,
        onlineSharedDeviceNotification: props.onlineSharedDeviceNotification,
        notificationEmail: props.notificationEmail,
        portalUrl: webHook && webHookUrl?.length ? webHookUrl : undefined,
        notificationSystem: props.notificationSystem,
      }
      props.handleUpdate(metadata)
    }
  }

  return (
    <>
      <List>
        <ListItemCheckbox label="System notification" checked={props.notificationSystem} onClick={handleSystemChange} />
        <ListItemCheckbox
          label="Email"
          disabled={panelDisable}
          checked={props.notificationEmail}
          onClick={handleEmailChange}
        />
        <ListItemCheckbox label="Webhook" disabled={panelDisable} checked={webHook} onClick={handleWebChange}>
          <ListItemSecondaryAction>
            <TextField
              disabled={!webHook}
              onChange={e => handleChange(e.currentTarget.value)}
              value={webHookUrl}
              label="URL endpoint"
              placeholder="Webhook Endpoint"
              required
              variant="filled"
              size="small"
              error={error}
              helperText={error ? 'Please provide a valid URL' : undefined}
            />
          </ListItemSecondaryAction>
        </ListItemCheckbox>
      </List>
      <List>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={panelDisable} size="small">
          {loading ? 'Saving' : 'Save'}
        </Button>
      </List>
    </>
  )
}

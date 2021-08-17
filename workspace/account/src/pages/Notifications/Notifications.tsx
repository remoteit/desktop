import React, { useState } from 'react'
import { Box,  Grid, List, TextField, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { REGEX_VALID_URL } from '../../constants'
import { ListItemSwitch } from '../../components/ListItemSwitch'
import { Gutters } from '../../components/Gutters'
import { Quote } from '../../components/Quote'

export const Notifications = () => {

  const {
    notificationUrl,
    urlNotifications,
    emailNotifications,
    desktopNotifications,
  } = useSelector((state: ApplicationState) => state.auth.notificationSettings)
  const dispatch = useDispatch<Dispatch>()
  const { updateUserMetadata } = dispatch.auth
  const [email, setEmail] = useState<boolean | undefined>(emailNotifications)
  const [system, setSystem] = useState<boolean | undefined>(desktopNotifications)

  const [webHook, setWebhook] = useState<boolean | undefined>(urlNotifications)
  const [webHookUrl, setWebhookUrl] = useState(notificationUrl)
  const [error, setError] = useState(false)
  const metadata: INotificationSetting = {
    desktopNotifications: system,
    emailNotifications: email,
    urlNotifications: webHook,
    notificationUrl: webHookUrl
  } 
  


  const onEmailChange =  (value: boolean) => {
    setEmail(value)
    updateUserMetadata({...metadata, emailNotifications: value})
    setError(false)
  }

  const onSystemChange = (value: boolean) => {
    setSystem(value)
    updateUserMetadata({...metadata, desktopNotifications: value})
    setError(false)
  }

  const onWebChange = (value: boolean) => {
    setWebhook(value)
    setWebhookUrl('')
    if (!value){
      updateUserMetadata({...metadata,
        notificationUrl: '',
        urlNotifications: false
      })
    }
    setError(false)
  }

  const onChange = ( value: string) => {
    setWebhookUrl(value)
    if (!REGEX_VALID_URL.test(value) &&  /\s/.test(value) && value.length > 10 ) {
      setError(true)
    } else {
      setError(false)
      updateUserMetadata({...metadata,
        notificationUrl: webHook && webHookUrl?.length ? webHookUrl : '',
        urlNotifications: webHook
      })
    }
    
  }

  return (
    <Section title="Notification Settings">
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Device Notifications
        </Typography>
      </Box>

      
      
      <Box>
        <Grid container>
          <Grid item xs={9} md={9}>
          <List>
            <ListItemSwitch label='System notification'  checked={system} onClick={onSystemChange} />
            <ListItemSwitch label='Email'  checked={email} onClick={onEmailChange} />
            <ListItemSwitch label="Webhook" checked={webHook} onClick={onWebChange} />
          </List>
        <Gutters inset noTop>
          <Quote margin={0}>
            <TextField
              disabled={!webHook}
              onChange={e => onChange(e.currentTarget.value)}
              onBlur={e => onChange(e.currentTarget.value)}
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
        </Grid>
        </Grid> 
      </Box>
      
    </Section>
  )
}

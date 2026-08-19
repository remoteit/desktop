import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Button, Typography, TextField } from '@mui/material'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { fullVersion } from '../helpers/versionHelper'
import { useHistory } from 'react-router-dom'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Link } from '../components/Link'

export const FeedbackPage: React.FC<{}> = () => {
  const { t } = useTranslation()
  const presets = useSelector((state: State) => state.feedback)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const [subject, setSubject] = useState(presets.subject)
  const [body, setBody] = useState(presets.body)

  const sendFeedback = () => {
    dispatch.feedback.set({ subject, body, data: presets.data })
    dispatch.feedback.sendFeedback()
    history.goBack()
  }

  const email = () => {
    window.location.href = encodeURI(`mailto:support@remote.it?subject=${fullVersion()} Feedback`)
  }

  return (
    <Container gutterBottom header={<Typography variant="h1">{t('feedbackPage.title', 'Contact')}</Typography>}>
      <Gutters>
        <Typography variant="body1">
          {t('feedbackPage.intro', 'Get support or provide feedback on how can we improve Remote.It.')}
        </Typography>
        <Typography variant="body2" color="GrayText">
          {t('feedbackPage.featureRequestHint', 'If you have a feature request, please include why it’s important to you.')}
        </Typography>
      </Gutters>
      <Gutters>
        <TextField
          autoFocus={!subject}
          fullWidth
          label={t('feedbackPage.subject', 'Subject')}
          variant="filled"
          value={subject}
          disabled={!!presets.subject}
          onChange={e => setSubject(e.target.value)}
        />
      </Gutters>
      <Gutters>
        <TextField
          multiline
          fullWidth
          autoFocus={!!subject}
          label={t('feedbackPage.message', 'Message')}
          variant="filled"
          value={body}
          sx={{ '& .MuiInputBase-input': { minHeight: '10rem' } }}
          onChange={e => setBody(e.target.value)}
        />
      </Gutters>
      <Gutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={body.length === 0} onClick={sendFeedback} color="primary" variant="contained">
          {t('feedbackPage.send', 'Send')}
        </Button>
        <Typography variant="caption">
          {t('feedbackPage.emailUsAt', 'You can also email us at')}
          <Link onClick={email}>support@remote.it</Link>
        </Typography>
      </Gutters>
      {presets.data && (
        <AccordionMenuItem subtitle={t('feedbackPage.includedData', 'Included data')} gutters>
          <Gutters>
            <Typography variant="caption">
              <pre>{JSON.stringify(presets.data, null, 2)}</pre>
            </Typography>
          </Gutters>
        </AccordionMenuItem>
      )}
    </Container>
  )
}


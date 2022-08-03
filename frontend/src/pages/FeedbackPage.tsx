import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { makeStyles } from '@mui/styles'
import { Button, Typography, TextField } from '@mui/material'
import { fullVersion } from '../helpers/versionHelper'
import { useHistory } from 'react-router-dom'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Link } from '../components/Link'

export const FeedbackPage: React.FC<{}> = () => {
  const { feedback } = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  const [subject, setSubject] = React.useState('')
  const [body, setBody] = React.useState('')

  const sendFeedback = () => {
    feedback.set({ subject, body })
    feedback.sendFeedback()
    history.goBack()
  }

  const email = () => {
    window.location.href = encodeURI(`mailto:support@remote.it?subject=${fullVersion()} Feedback`)
  }

  return (
    <Container gutterBottom header={<Typography variant="h1">Contact</Typography>}>
      <Gutters>
        <Typography variant="body1">Get support or provide feedback on how can we improve Remote.It.</Typography>
        <Typography variant="body2" color="textSecondary">
          If you have a feature request, please include how you would use it and why it’s important to you.
        </Typography>
      </Gutters>
      <Gutters>
        <TextField autoFocus fullWidth label="Subject" variant="filled" onChange={e => setSubject(e.target.value)} />
        <TextField
          multiline
          fullWidth
          label="Message"
          variant="filled"
          className={css.input}
          onChange={e => setBody(e.target.value)}
        />
      </Gutters>
      <Gutters className={css.flex}>
        <Button disabled={body.length === 0} onClick={sendFeedback} color="primary" variant="contained">
          Send
        </Button>
        <Typography variant="caption">
          You can also email us at<Link onClick={email}>support@remote.it</Link>
        </Typography>
      </Gutters>
    </Container>
  )
}

const useStyles = makeStyles({
  input: { '& .MuiInputBase-input': { minHeight: '10rem' } },
  flex: { display: 'flex', justifyContent: 'space-between' },
})

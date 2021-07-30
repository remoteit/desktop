import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, Button, Typography, Link, TextField } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { version } from '../../../package.json'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

export const ShareFeedback: React.FC<{}> = () => {
  const { feedback } = useDispatch<Dispatch>()
  const { sending, sent } = useSelector((state: ApplicationState) => ({
    sending: state.feedback.sending,
    sent: state.feedback.sent,
  }))
  const history = useHistory()
  const css = useStyles()
  const [text, setText] = React.useState('')

  useEffect(() => {
    if (sent) {
      history.goBack()
    }

    return () => {
      feedback.set({ sent: false })
    }
  }, [sent])

  const sendFeedback = () => {
    feedback.set({ body: text })
    feedback.sendFeedback()
  }

  const onChangeText = e => {
    setText(e.target.value)
  }

  const email = () => {
    window.location.href = encodeURI(`mailto:support@remote.it?subject=Desktop v${version} Feedback`)
  }

  return (
    <Container gutterBottom header={<Typography variant="h1">Share Feedback</Typography>}>
      <Gutters>
        <Typography variant="body1">How can we improve remote.it?</Typography>
        <Typography variant="body2" color="textSecondary">
          If you have a feature request, please include how you would use it and why it’s important to you?
        </Typography>
      </Gutters>
      <Gutters>
        <TextField
          autoFocus
          multiline
          fullWidth
          label="Message"
          size="small"
          variant="filled"
          className={css.input}
          onChange={onChangeText}
        />
      </Gutters>
      <Gutters className={css.flex}>
        <Button
          disabled={sending || text.length === 0}
          onClick={sendFeedback}
          color="primary"
          variant="contained"
          startIcon={sending && <Icon name="spinner-third" size="sm" spin type="regular" />}
        >
          {sending ? 'Sending' : 'Send'}
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

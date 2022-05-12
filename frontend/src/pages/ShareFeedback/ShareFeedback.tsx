import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { makeStyles, Button, Typography, Link, TextField } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { fullVersion } from '../../helpers/versionHelper'

export const ShareFeedback: React.FC<{}> = () => {
  const { feedback } = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()
  const [text, setText] = React.useState('')

  const sendFeedback = () => {
    feedback.set({ body: text })
    feedback.sendFeedback()
    history.goBack()
  }

  const email = () => {
    window.location.href = encodeURI(`mailto:support@remote.it?subject=${fullVersion()} Feedback`)
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
          variant="filled"
          className={css.input}
          onChange={e => setText(e.target.value)}
        />
      </Gutters>
      <Gutters className={css.flex}>
        <Button disabled={text.length === 0} onClick={sendFeedback} color="primary" variant="contained">
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

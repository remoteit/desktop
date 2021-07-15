import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, Button, Divider, InputBase, Box, Grid, Typography, List } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import styles from '../../styling'
import { Icon } from '../../components/Icon'
import { Title } from '../../components/Title'
import { Container } from '../../components/Container'


export const ShareFeedback: React.FC<{}> = () => {
  const { feedback } = useDispatch<Dispatch>()
  const { sending, sent } = useSelector((state: ApplicationState) => ({
    sending: state.feedback.sending,
    sent: state.feedback.sent
  }))
  const history = useHistory()
  const css = useStyles()
  const [preview, setPreview] = React.useState('')

  useEffect(() => {
    if (sent) {
      history.goBack()
    }

    return () => {
      feedback.set({ sent: false })
    };
  }, [sent]);

  const sendFeedback = () => {
    feedback.sendFeedback()
  }

  const onChange = (e) => {
    setPreview(URL.createObjectURL(e.target.files[0]))
  }

  return (
    <div>
      <Container
        gutterBottom
        header={
          <>
            <Typography variant="h1">
              <Title>Share Feedback</Title>
            </Typography>
          </>
        }
      >
        <List>
          <Box mt={2} marginLeft={4} pr={10}>
            <Typography variant="body2">
              How can we improve remote.it? If you have a feature request,
              can you also let us know how you would use it and why it’s important to you?
            </Typography>
            <Box pl={1} pb={2} minHeight={200} borderRadius={3} borderColor="#ccc" border={0}>
              <InputBase
                autoFocus={true}
                margin="none"
                required={true}
                placeholder=""
                id="name"
                multiline={true}
                fullWidth
                className={css.inputText}
                inputProps={{ 'aria-label': 'naked' }}
                rowsMax={10}
              />
            </Box>
            <Box mt={2} mb={2}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Icon name="paperclip" size="md" fixedWidth />}
                className={css.buttonUpload}
                size="small"
              >
                Attach images, files or videos
                <input type="file" hidden onChange={onChange} />
              </Button>

            </Box>
            {preview && (<Box m={1}>
              <img src={preview} className={css.img}></img>
            </Box>)}
            <Divider></Divider>
            <Box paddingLeft={2} paddingRight={2}>
              <Grid container>
                <Grid item xs={8} md={8}>
                  <Box m={2}>
                    <Typography variant="caption">You can also email us at support@remote.it</Typography>
                  </Box></Grid>
                <Grid item xs={4} md={4}>
                  <Box m={2} textAlign="right">
                    <Button
                      disabled={sending}
                      onClick={sendFeedback}
                      color="primary"
                      variant="contained"
                      startIcon={sending && <Icon name="spinner-third" size="sm" spin type="regular" />}
                    >
                      {sending ? 'Sending' : 'Send'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

          </Box>
        </List>
      </Container>
    </div>
  );
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
  inputText: {
    overflow: 'hidden',
  },
  buttonUpload: {
    textTransform: 'capitalize',
    fontWeight: 400,
    letterSpacing: 0
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 16,
  },
  img: {
    maxHeight: 100,
    maxWidth: 100,
    borderRadius: 3
  }
})

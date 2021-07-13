import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, PaperProps, Paper, Dialog, DialogTitle, DialogContentText, DialogContent, IconButton, Button, TextareaAutosize, Divider, TextField, InputBase, Box, Grid, Typography, InputAdornment } from '@material-ui/core'

import { useHistory } from 'react-router-dom'
import styles from '../../styling'
import Draggable from 'react-draggable'
import { Icon } from '../../components/Icon'


function PaperComponent(props: PaperProps) {
  return (
    <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

export const ShareFeedback: React.FC<{
  dialogOpen: boolean
}> = ({
  dialogOpen
}) => {
    const { feedback } = useDispatch<Dispatch>()
    const { sending } = useSelector((state: ApplicationState) => ({
      sending: state.feedback.sending
    }))
    const history = useHistory()
    const css = useStyles()
    const [open, setOpen] = React.useState(dialogOpen)
    const [preview, setPreview] = React.useState('')

    useEffect(() => {

    }, [])

    const onClose = () => {
      setOpen(false);
      history.goBack()
    }

    const sendFeedback = () => {
      feedback.sendFeedback()
      !sending && onClose()
    }

    const onChange = (e) => {
      setPreview(URL.createObjectURL(e.target.files[0]))
    }

    return (
      <div>
        <Dialog
          open={open}
          onClose={onClose}
          PaperComponent={PaperComponent}
          aria-labelledby="draggable-dialog-title"
          maxWidth="sm"
        >
          <DialogTitle style={{ marginTop: 10, marginRight: 10 }} id="draggable-dialog-title">
            Send Feedback
            <IconButton aria-label="close" className={css.closeButton} onClick={onClose}>
              <Icon name="times" size="sm" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              How can we improve remote.it? If you have a feature request,
              can you also let us know how you would use it and why it’s important to you?
            </DialogContentText>
            <Divider></Divider>
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
            <Box mt={1}>
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

          </DialogContent>
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
                    startIcon={sending ? <Icon name="spinner-third" size="sm" spin type="regular" /> : null}
                  >
                    Send
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

        </Dialog>
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

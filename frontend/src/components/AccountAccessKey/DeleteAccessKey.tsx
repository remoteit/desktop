import React, { useState, useEffect } from 'react'
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from '@material-ui/core/styles'

import Dialog from '@material-ui/core/Dialog'
import MuiDialogTitle from '@material-ui/core/DialogTitle'
import MuiDialogContent from '@material-ui/core/DialogContent'
import MuiDialogActions from '@material-ui/core/DialogActions'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import { Icon } from '../Icon'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { Button, makeStyles } from '@material-ui/core'



export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string
  children: React.ReactNode
  onClose: () => void
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },

  })
const useStyles = makeStyles({
  button: {
    borderRadius: 3,
    margin: 10
  }
})

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}
        >
          <Icon name='times' size='lg' />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  )
})

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(3),
  },
}))(MuiDialogContent)

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    // padding: theme.spacing(1),
  },
}))(MuiDialogActions)

export function DeleteAccessKey({ ...props }) {
  const [open, setOpen] = useState(false)
  const [deleteKey, setDeleteKey] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [visiblility, setVisibility] = useState(false)
  const { accounts } = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    setDeleteKey(props.deleteKey)
    setVisibility(props.enabled)
  })
  function handleDeleteClick() {
    open ? setOpen(false) : setOpen(true)
  }
  function handleChange(e) {
    const val = e.currentTarget.value
    setDeleteConfirmText(val)
  }

  function handleClose() {
    setOpen(false)
  }

  async function confirmDelete() {
    if (deleteConfirmText.length && deleteConfirmText === 'DELETE') {
      const properties = { key: deleteKey }
      await accounts.deleteAccessKeys(properties)
    }
  }
  return (
    <div>
      {!visiblility ? (
        <Icon
          name="trash-alt"
          fixedWidth
          onClick={handleDeleteClick}
        />
      ) : (
        <></>
      )}
      {open ? (
        <form onSubmit={confirmDelete}>
          <Dialog
            onClose={handleClose}
            aria-labelledby="delete-dialog-title"
            open={true}
          >
            <DialogTitle id="delete-dialog-title" onClose={handleClose}>
              Delete Access Key
            </DialogTitle>
            <DialogContent dividers>
              <Typography gutterBottom>
                This access key will be permanently deleted and cannot be
                undone.
              </Typography>
              <Typography gutterBottom>Type DELETE to confirm</Typography>
              <FormControl fullWidth>
                <TextField
                  required
                  autoFocus
                  variant="filled"
                  onChange={handleChange}
                  value={deleteConfirmText}
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                variant='outlined'
                size="small"
                color="primary"
                onClick={handleClose}
                className={css.button}
              >
                CANCEL
              </Button>
              <Button
                size="small"
                variant="contained"
                className={css.button}
                color="default"
                onClick={confirmDelete}
                disabled={!(deleteConfirmText === 'DELETE')}
              >
                DELETE
              </Button>
            </DialogActions>
          </Dialog>
        </form>
      ) : (
        <></>
      )}
    </div>
  )
}




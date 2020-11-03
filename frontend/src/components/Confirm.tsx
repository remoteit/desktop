import { Slide, Button, Dialog, DialogTitle, DialogActions, DialogContent, Typography } from '@material-ui/core'
import { TransitionProps } from '@material-ui/core/transitions'
import React from 'react'

export const Confirm: React.FC<{
  title?: string
  open: boolean
  onConfirm: () => void
  onDeny: () => void
}> = ({ title, open, onConfirm, onDeny, children }) => (
  <Dialog
    open={open}
    maxWidth="xs"
    TransitionComponent={Transition}
    transitionDuration={300}
    onClose={onDeny}
    fullWidth
  >
    {title && <DialogTitle>{title}</DialogTitle>}
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      <Button color="primary" onClick={onDeny}>
        Cancel
      </Button>
      <Button autoFocus variant="contained" color="primary" onClick={onConfirm}>
        &nbsp; Ok &nbsp;
      </Button>
    </DialogActions>
  </Dialog>
)

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />
})

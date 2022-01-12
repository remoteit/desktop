import { Slide, Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@material-ui/core'
import { TransitionProps } from '@material-ui/core/transitions'
import React from 'react'

export const Confirm: React.FC<{
  title?: string
  action?: string
  open: boolean
  onConfirm: (e: React.MouseEvent) => void
  onDeny: () => void
}> = ({ title, action = 'Ok', open, onConfirm, onDeny, children }) => (
  <Dialog
    open={open}
    maxWidth="xs"
    TransitionComponent={Transition}
    transitionDuration={200}
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
        &nbsp; {action} &nbsp;
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

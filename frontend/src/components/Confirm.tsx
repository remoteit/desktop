import {
  Slide,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogProps,
  ButtonProps,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import React from 'react'

export type ConfirmProps = {
  title?: React.ReactNode
  action?: string
  open: boolean
  disabled?: boolean
  maxWidth?: DialogProps['maxWidth']
  color?: ButtonProps['color']
  children?: React.ReactNode
  onConfirm: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeny?: () => void
}

export const Confirm: React.FC<ConfirmProps> = ({
  title,
  action = 'Ok',
  open,
  onConfirm,
  onDeny,
  maxWidth = 'xs',
  color = 'primary',
  disabled,
  children,
}) => (
  <Dialog
    open={open}
    maxWidth={maxWidth}
    TransitionComponent={Transition}
    transitionDuration={200}
    onClose={onDeny || onConfirm}
    fullWidth
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      {onDeny && (
        <Button color="primary" onClick={onDeny}>
          Cancel
        </Button>
      )}
      <Button autoFocus variant="contained" color={color} disabled={disabled} onClick={onConfirm}>
        &nbsp; {action} &nbsp;
      </Button>
    </DialogActions>
  </Dialog>
)

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />
})

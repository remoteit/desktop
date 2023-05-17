import React from 'react'
import { IconButton, ButtonProps } from './IconButton'
import { Confirm, ConfirmProps } from '../components/Confirm'

type Props = ButtonProps & {
  confirm?: boolean
  confirmProps?: Omit<ConfirmProps, 'open' | 'onConfirm' | 'onDeny'>
}

export const ConfirmButton: React.FC<Props> = ({ onClick, confirm, confirmProps, ...props }) => {
  const [open, setOpen] = React.useState<boolean>(false)

  const handleClick = e => {
    if (confirm) setOpen(true)
    else onClick?.(e)
  }

  const handleConfirm = e => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <>
      <IconButton {...props} onClick={handleClick} />
      {confirm && onClick && (
        <Confirm {...confirmProps} open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)}>
          {confirmProps?.children}
        </Confirm>
      )}
    </>
  )
}

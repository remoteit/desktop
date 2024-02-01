import React, { useState, forwardRef } from 'react'
import { IconButton, ButtonProps } from './IconButton'
import { Confirm, ConfirmProps } from '../components/Confirm'

type Props = ButtonProps & {
  confirm?: boolean
  confirmProps?: Omit<ConfirmProps, 'open' | 'onConfirm' | 'onDeny'>
}

export const ConfirmIconButton = forwardRef<HTMLButtonElement, Props>(({ onClick, confirm, confirmProps, ...props }, ref) => {
  const [open, setOpen] = useState<boolean>(false)

  const handleClick = (e: React.MouseEvent) => {
    if (confirm) setOpen(true)
    else onClick?.(e)
  }

  const handleConfirm = (e: React.MouseEvent) => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <>
      <IconButton ref={ref} {...props} onClick={handleClick} />
      {confirm && onClick && (
        <Confirm {...confirmProps} open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)}>
          {confirmProps?.children}
        </Confirm>
      )}
    </>
  )
})

import React, { useState, forwardRef } from 'react'
import { Button, ButtonProps } from '@mui/material'
import { Confirm, ConfirmProps } from '../components/Confirm'

type Props = ButtonProps & {
  confirm?: boolean
  confirmProps?: Omit<ConfirmProps, 'open' | 'onConfirm' | 'onDeny'>
}

export const ConfirmButton = forwardRef<HTMLButtonElement, Props>(({ onClick, confirm, confirmProps, ...props }, ref) => {
  const [open, setOpen] = useState<boolean>(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirm) setOpen(true)
    else onClick?.(e)
  }

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <>
      <Button ref={ref} {...props} onClick={handleClick} />
      {confirm && onClick && (
        <Confirm {...confirmProps} open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)}>
          {confirmProps?.children}
        </Confirm>
      )}
    </>
  )
})

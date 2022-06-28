import React from 'react'
import { IconButton, ButtonProps } from './IconButton'
import { Confirm } from '../components/Confirm'

type Props = ButtonProps & {
  confirm?: boolean
  confirmTitle?: string
  confirmMessage?: React.ReactNode
}

export const ConfirmButton: React.FC<Props> = ({
  onClick,
  confirm,
  confirmMessage = 'Are you sure?',
  confirmTitle = '',
  ...props
}) => {
  const [open, setOpen] = React.useState<boolean>(false)

  const handleClick = e => {
    if (confirm) setOpen(true)
    else onClick && onClick(e)
  }

  const handleConfirm = e => {
    onClick && onClick(e)
    setOpen(false)
  }

  return (
    <>
      <IconButton {...props} onClick={handleClick} size="lg" />
      {confirm && onClick && (
        <Confirm open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)} title={confirmTitle}>
          {confirmMessage}
        </Confirm>
      )}
    </>
  )
}

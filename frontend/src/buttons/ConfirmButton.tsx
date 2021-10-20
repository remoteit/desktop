import React from 'react'
import { IconButton, ButtonProps } from './IconButton'
import { Confirm } from '../components/Confirm'

type Props = ButtonProps & {
  confirm?: boolean
  confirmTitle?: string
  confirmMessage?: string | React.ReactElement
}

export const ConfirmButton: React.FC<Props> = ({
  onClick,
  confirm,
  confirmMessage = 'Are you sure?',
  confirmTitle = '',
  ...props
}) => {
  const [open, setOpen] = React.useState<boolean>(false)

  const handleClick = () => {
    if (confirm) setOpen(true)
    else onClick && onClick()
  }

  const handleConfirm = () => {
    onClick && onClick()
    setOpen(false)
  }

  return (
    <>
      <IconButton {...props} onClick={handleClick} />
      {confirm && onClick && (
        <Confirm open={open} onConfirm={handleConfirm} onDeny={() => setOpen(false)} title={confirmTitle}>
          {confirmMessage}
        </Confirm>
      )}
    </>
  )
}

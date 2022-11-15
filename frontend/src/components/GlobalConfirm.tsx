import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'

const GLOBAL_DIALOGS: ILookup<{ title: string; message: React.ReactNode; action?: string }> = {
  destroyLink: {
    title: 'Reset persistent endpoint?',
    message: 'This will clear your connect link url so that a new one will be created when you restart again.',
    action: 'Reset',
  },
  forceUnregister: {
    title: 'Force removal?',
    message: (
      <>
        <Notice severity="error" fullWidth gutterBottom>
          This device is owned by another user. You will be permanently removing it.
        </Notice>
        Use your system admin privileges to unregister this device?
      </>
    ),
  },
}

export const GlobalConfirm: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const confirm = useSelector((state: ApplicationState) => state.ui.confirm)
  const [open, setOpen] = React.useState<boolean>(false)
  const dialog = GLOBAL_DIALOGS[confirm?.id || '']

  const close = () => dispatch.ui.set({ confirm: undefined })
  const handleConfirm = async () => {
    await confirm?.callback()
    close()
  }

  useEffect(() => {
    setOpen(!!confirm)
  }, [confirm])

  if (!dialog) return null

  return (
    <Confirm
      open={open}
      onConfirm={handleConfirm}
      onDeny={close}
      title={dialog.title}
      color="error"
      action={dialog.action}
    >
      {dialog.message}
    </Confirm>
  )
}

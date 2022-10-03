import React, { useEffect } from 'react'
import { Confirm } from '../components/Confirm'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'

const GLOBAL_DIALOGS: ILookup<{ title: string; message: React.ReactNode }> = {
  destroyLink: {
    title: 'Remove persistent endpoint?',
    message: 'Once removed, this endpoint will no longer work. If you restart the connection you will get a new url.',
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
    <Confirm open={open} onConfirm={handleConfirm} onDeny={close} title={dialog.title}>
      {dialog.message}
    </Confirm>
  )
}

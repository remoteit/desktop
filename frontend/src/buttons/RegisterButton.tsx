import React, { useState } from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Confirm } from '../components/Confirm'
import { PromptModal } from '../components/PromptModal'
import { Icon } from '../components/Icon'

export const RegisterButton: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false)
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))
  const { ui } = useDispatch<Dispatch>()

  if (!user?.email.includes('remote.it')) return null

  const onClick = () => {}

  return (
    <>
      <Tooltip title="Enter Registration">
        <div>
          <IconButton onClick={onClick}>
            <Icon name="plus" size="sm" type="regular" />
          </IconButton>
        </div>
      </Tooltip>

      {/* <Confirm
        open={open}
        onConfirm={() => {
          ui.set({ restoring: true, restore: false })
          emit('restore', device.id)
        }}
        onDeny={() => setOpen(false)}
        title="Restore device from Cloud"
      >
        We will attempt to restore this device's configuration. Please note this may not completely restore services
        that have custom host information.
      </Confirm> */}
    </>
  )
}

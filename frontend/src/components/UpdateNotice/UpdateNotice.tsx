import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, Button, IconButton } from '@mui/material'
import { selectUpdateNotice } from '../../models/backend'
import { isElectron, isRemote } from '../../services/Browser'
import { Confirm } from '../Confirm'
import { Notice } from '../Notice'
import { Icon } from '../Icon'

export const UpdateNotice: React.FC<{ className: string }> = ({ className }) => {
  const updateReady = useSelector((state: ApplicationState) => selectUpdateNotice(state))
  const [confirm, setConfirm] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(!!updateReady)
  const dispatch = useDispatch<Dispatch>()

  const handleClick = () => {
    setConfirm(true)
  }

  const handleConfirm = () => {
    setOpen(false)
    setConfirm(false)
    dispatch.backend.install()
  }

  const handleDisable = () => {
    setOpen(false)
    setConfirm(false)
    dispatch.backend.disableAutoUpdate()
  }

  useEffect(() => {
    if (updateReady) setOpen(true)
  }, [updateReady])

  if (!isElectron() || isRemote()) return null

  return (
    <>
      <Snackbar
        open={open}
        className={className}
        message={`An update is available (v${updateReady}).`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        action={[
          <Button key="disable" size="small" color="primary" onClick={handleDisable}>
            Disable Updates
          </Button>,
          <Button key="restart" variant="contained" color="primary" size="small" onClick={handleClick}>
            Install
          </Button>,
          <IconButton
            key="close"
            onClick={() => {
              setOpen(false)
              dispatch.backend.setUpdateNotice(updateReady)
            }}
            size="large"
          >
            <Icon name="times" color="white" size="md" fixedWidth />
          </IconButton>,
        ]}
      />
      {confirm && (
        <Confirm
          open={confirm}
          onConfirm={handleConfirm}
          onDeny={() => setConfirm(false)}
          title="Are you sure?"
          action="Install"
        >
          <Notice severity="error" fullWidth gutterBottom>
            Restarting while connected over a remote.it connection will cause the connection to be permanently lost.
          </Notice>
          You must be at the computer locally to update.
        </Confirm>
      )}
    </>
  )
}

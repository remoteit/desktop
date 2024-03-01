import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Snackbar, Button } from '@mui/material'
import { selectUpdateNotice } from '../../selectors/ui'
import { Confirm } from '../Confirm'
import { Notice } from '../Notice'
import browser from '../../services/Browser'

export const UpdateNotice: React.FC<{ className: string }> = ({ className }) => {
  const updateReady = useSelector((state: State) => selectUpdateNotice(state))
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
    setOpen(!!updateReady)
  }, [updateReady])

  if (!browser.isElectron || browser.isRemote) return null

  return (
    <>
      <Snackbar
        open={open}
        className={className}
        message={
          <Notice
            invert
            onClose={() => {
              setOpen(false)
              dispatch.backend.setUpdateNotice(updateReady)
            }}
            fullWidth
            button={[
              <Button key="disable" size="small" color="primary" onClick={handleDisable}>
                Disable Updates
              </Button>,
              <Button key="restart" variant="contained" color="primary" size="small" onClick={handleClick}>
                Install
              </Button>,
            ]}
          >
            An update is available (v{updateReady}).
          </Notice>
        }
      />
      {confirm && (
        <Confirm
          open={confirm}
          onConfirm={handleConfirm}
          onDeny={() => setConfirm(false)}
          title="Are you sure?"
          action="Install"
        >
          <Notice severity="warning" fullWidth gutterBottom>
            Restarting while connected over a Remote.It connection could cause the connection to be permanently lost.
          </Notice>
          It is recommended to have a local connection when updating.
        </Confirm>
      )}
    </>
  )
}

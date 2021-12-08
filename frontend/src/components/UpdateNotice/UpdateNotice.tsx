import React, { useState, useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, Button, IconButton } from '@material-ui/core'
import { selectUpdateNotice } from '../../models/backend'
import { isHeadless } from '../../services/Browser'
import { Icon } from '../Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UpdateNotice: React.FC = () => {
  const updateReady = useSelector((state: ApplicationState) => selectUpdateNotice(state))
  const [open, setOpen] = useState<boolean>(!!updateReady)
  const { backend } = useDispatch<Dispatch>()

  useEffect(() => {
    if (updateReady) setOpen(true)
  }, [updateReady])

  if (isHeadless()) return null

  return (
    <Snackbar
      open={open}
      message={`An update is available (v${updateReady}).`}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      action={[
        <Button
          key="restart"
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            analyticsHelper.track('update')
            emit('restart', updateReady)
          }}
        >
          Restart
        </Button>,
        <IconButton
          key="close"
          onClick={() => {
            setOpen(false)
            backend.setUpdateNotice(updateReady)
          }}
        >
          <Icon name="times" color="white" size="md" fixedWidth />
        </IconButton>,
      ]}
    />
  )
}

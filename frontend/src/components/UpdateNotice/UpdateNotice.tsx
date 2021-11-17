import React, { useState } from 'react'
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

  if (isHeadless()) return null

  return (
    <Snackbar
      open={open}
      message={`An update is available (v${updateReady}).`}
      action={[
        <Button
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

import React from 'react'
import { emit } from '../../services/Controller'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Snackbar, Button, IconButton } from '@material-ui/core'
import { selectUpdateNotice } from '../../models/backend'
import { isHeadless } from '../../services/Browser'
import { Icon } from '../Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UpdateNotice: React.FC = () => {
  const updateVersion = useSelector((state: ApplicationState) => selectUpdateNotice(state))
  const { backend } = useDispatch<Dispatch>()

  if (isHeadless()) return null

  return (
    <Snackbar
      open={!!updateVersion}
      message={`An update is available (v${updateVersion}).`}
      action={[
        !isHeadless() && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              analyticsHelper.track('update')
              emit('restart', updateVersion)
            }}
          >
            Restart
          </Button>
        ),
        <IconButton onClick={() => backend.setUpdateNotice(updateVersion)}>
          <Icon name="times" color="white" size="md" fixedWidth />
        </IconButton>,
      ]}
    />
  )
}

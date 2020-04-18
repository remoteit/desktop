import React, { useState, useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Snackbar, Button, IconButton } from '@material-ui/core'
import { version } from '../../../package.json'
import { Icon } from '../../components/Icon'
import Analytics from '../../helpers/Analytics'

export const UpdateNotice: React.FC = () => {
  const [updateNotice, setUpdateNotice] = useState<boolean>(false)
  const { update } = useSelector((state: ApplicationState) => state.backend)

  useEffect(() => {
    if (update && update !== version) setUpdateNotice(true)
  }, [update])

  return (
    <Snackbar
      open={updateNotice}
      message={`An update is available (v${update}).`}
      action={[
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            Analytics.Instance.track('update')
            emit('restart')
          }}
        >
          Restart
        </Button>,
        <IconButton onClick={() => setUpdateNotice(false)}>
          <Icon name="times" color="white" size="md" fixedWidth />
        </IconButton>,
      ]}
    />
  )
}

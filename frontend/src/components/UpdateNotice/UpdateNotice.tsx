import React, { useState, useEffect } from 'react'
import { emit } from '../../services/Controller'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Snackbar, Button, IconButton } from '@material-ui/core'
import { version } from '../../../package.json'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'
import { getLocalStorageByUser, isHeadless, setLocalStorageByUser } from '../../services/Browser'

const NOTICE_VERSION_ID = 'notice-version'

export const UpdateNotice: React.FC = () => {
  const [updateNotice, setUpdateNotice] = useState<boolean>(false)
  const { update } = useSelector((state: ApplicationState) => state.backend)
  const [versionShown, setVersionShown] = useState<boolean>(false)

  useEffect(() => {
    if (update && update !== version) {
      let noticeVersion = getLocalStorageByUser(NOTICE_VERSION_ID)
      if (noticeVersion) {
        noticeVersion = JSON.parse(noticeVersion)
        noticeVersion === update && setVersionShown(true)
      } else {
        setLocalStorageByUser(NOTICE_VERSION_ID, JSON.stringify(update))
      }
      setUpdateNotice(true)
    }
  }, [update])

  if (isHeadless() && versionShown) return <></>

  return (
    <Snackbar
      open={updateNotice}
      message={`An update is available (v${update}).`}
      action={[
        !isHeadless() && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              analyticsHelper.track('update')
              emit('restart', update)
            }}
          >
            Restart
          </Button>
        ),
        <IconButton onClick={() => setUpdateNotice(false)}>
          <Icon name="times" color="white" size="md" fixedWidth />
        </IconButton>,
      ]}
    />
  )
}

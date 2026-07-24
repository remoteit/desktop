import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Snackbar, Button, SxProps, Theme } from '@mui/material'
import { selectUpdateNotice } from '../../selectors/ui'
import { Confirm } from '../Confirm'
import { Notice } from '../Notice'
import browser from '../../services/browser'

export const UpdateNotice: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => {
  const { t } = useTranslation()
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
        sx={sx}
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
                {t('updateNotice.disableUpdates', 'Disable Updates')}
              </Button>,
              <Button key="restart" variant="contained" color="primary" size="small" onClick={handleClick}>
                {t('updateNotice.install', 'Install')}
              </Button>,
            ]}
          >
            {t('updateNotice.updateAvailable', { version: updateReady, defaultValue: 'An update is available (v{{version}}).' })}
          </Notice>
        }
      />
      {confirm && (
        <Confirm
          open={confirm}
          onConfirm={handleConfirm}
          onDeny={() => setConfirm(false)}
          title={t('common.areYouSure', 'Are you sure?')}
          action={t('updateNotice.install', 'Install')}
        >
          <Notice severity="warning" fullWidth gutterBottom>
            {t(
              'updateNotice.restartWarning',
              'Restarting while connected over a Remote.It connection could cause the connection to be permanently lost.'
            )}
          </Notice>
          {t('updateNotice.recommendLocalConnection', 'It is recommended to have a local connection when updating.')}
        </Confirm>
      )}
    </>
  )
}

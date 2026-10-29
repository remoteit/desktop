import React, { useState } from 'react'
import type { TFunction } from 'i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Button, Stack } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { Dispatch, State } from '../store'
import { useCanDecommission, disabledWhen } from '../hooks/useDeviceDisable'
import { DecommissionDialog } from './DecommissionDialog'
import { Notice } from './Notice'

// When it was disabled, and why: a person, or the expiry (offline past its registration's timeout).
export function disabledDescription(t: TFunction, device: Pick<IDevice, 'disabledAt' | 'disabledReason'>) {
  const when = disabledWhen(device.disabledAt)
  if (device.disabledReason === 'expired')
    return when
      ? t('disabledDevice.expiredWhen', {
          when,
          defaultValue:
            'Disabled {{when}}: offline past its registration’s timeout. It restores itself when it returns.',
        })
      : t(
          'disabledDevice.expired',
          'Disabled: offline past its registration’s timeout. It restores itself when it returns.'
        )
  if (when) return t('disabledDevice.when', { when, defaultValue: 'Disabled {{when}}' })
  return t('disabledDevice.disabled', 'Disabled')
}

// A disabled device's page: what it is, and Restore — Decommission… for its owner or an org admin.
export const DisabledDeviceNotice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const destroying = useSelector((state: State) => state.ui.destroying)
  const canDecommission = useCanDecommission(device)
  const [decommission, setDecommission] = useState(false)
  const manage = device.permissions.includes('MANAGE')

  return (
    <>
      <Notice
        gutterTop
        severity="warning"
        button={
          (manage || canDecommission) && (
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ marginY: 0.5 }}>
              {manage && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  disabled={destroying}
                  onClick={() => dispatch.devices.restore([device.id])}
                >
                  {t('disabledDevice.restore', 'Restore')}
                </Button>
              )}
              {canDecommission && (
                <Button size="small" color="error" disabled={destroying} onClick={() => setDecommission(true)}>
                  {t('disabledDevice.decommission', 'Decommission…')}
                </Button>
              )}
            </Stack>
          )
        }
      >
        <strong>{disabledDescription(t, device)}</strong>
        <em>{t('disabledDevice.notServing', 'It serves nothing until it is restored.')}</em>
      </Notice>
      <DecommissionDialog
        open={decommission}
        devices={[device]}
        onClose={() => setDecommission(false)}
        onDone={() => history.push('/devices/disabled')}
      />
    </>
  )
}

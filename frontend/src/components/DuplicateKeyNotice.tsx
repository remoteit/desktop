import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Stack } from '@mui/material'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { disabledWhen } from '../hooks/useDeviceDisable'
import { AddDuplicateDeviceDialog, DuplicateTarget } from './AddDuplicateDeviceDialog'
import { IssueDeviceJoinKeyDialog } from './IssueDeviceJoinKeyDialog'
import { Notice } from './Notice'

/* A device flagged as held by another machine too (Device.duplicate; graphql-api docs/PROXY-GROUPS.md §11, "Duplicate
   devices"). Its device join key on a second machine (kind device-join-key): the copy is refused quietly while the
   owner chooses — keep the copy as a new device or make it the original, each a new device whose key goes on that
   machine, or neither, rotating the device's keys. A daemon that cannot take an identity of its own (kind key): refused,
   with nothing to choose until it is updated. */
export const DuplicateKeyNotice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const served = useDeviceIdentity()
  const [choice, setChoice] = useState<DuplicateTarget | 'rotate'>()

  const flag = device.duplicate
  if (!flag) return null

  const when = disabledWhen(flag.since)
  const seen =
    when && flag.address
      ? t('duplicateKey.seenFrom', { when, address: flag.address, defaultValue: 'Seen {{when}} from {{address}}.' })
      : when
      ? t('duplicateKey.seen', { when, defaultValue: 'Seen {{when}}.' })
      : flag.address
      ? t('duplicateKey.from', { address: flag.address, defaultValue: 'From {{address}}.' })
      : ''

  if (flag.kind !== 'device-join-key')
    return (
      <Notice gutterTop severity="warning">
        <strong>
          {t('duplicateKey.keyTitle', {
            name: device.name,
            defaultValue: 'Another machine signed in as {{name}} while it was online',
          })}
        </strong>
        <em>
          {seen}{' '}
          {t(
            'duplicateKey.keyBody',
            'It was refused: its daemon cannot take an identity of its own. Update the daemon on that machine, and it is split off as a copy you can keep or remove.'
          )}
        </em>
      </Notice>
    )

  const manage = device.permissions.includes('MANAGE')
  const add = manage && !!served?.addDuplicateDevice
  const rotate = manage && !!served?.joinKeys

  return (
    <>
      <Notice
        gutterTop
        severity="warning"
        button={
          (add || rotate) && (
            <Stack spacing={1} alignItems="stretch" sx={{ marginY: 0.5, minWidth: 200 }}>
              {add && (
                <Button size="small" variant="contained" color="warning" onClick={() => setChoice('copy')}>
                  {t('duplicateKey.keepCopy', 'Keep the copy as a new device')}
                </Button>
              )}
              {add && (
                <Button size="small" color="warning" onClick={() => setChoice('original')}>
                  {t('duplicateKey.makeOriginal', 'Make the copy the original')}
                </Button>
              )}
              {rotate && (
                <Button size="small" color="error" onClick={() => setChoice('rotate')}>
                  {t('duplicateKey.rotate', 'Neither: rotate keys')}
                </Button>
              )}
            </Stack>
          )
        }
      >
        <strong>
          {t('duplicateKey.title', {
            name: device.name,
            defaultValue: 'The device join key of {{name}} is in use on another machine',
          })}
        </strong>
        <em>
          {seen}{' '}
          {t('duplicateKey.body', {
            name: device.name,
            defaultValue:
              'Whichever machine is online first is {{name}}; the other is refused quietly until you choose: keep the copy as a new device, make it the original — each a new device whose key you install on that machine — or neither, rotating the keys so the copy cannot sign in at all.',
          })}
        </em>
      </Notice>
      {(choice === 'copy' || choice === 'original') && (
        <AddDuplicateDeviceDialog
          device={device}
          target={choice}
          rotate={rotate}
          onRotate={() => setChoice('rotate')}
          onClose={() => setChoice(undefined)}
        />
      )}
      {choice === 'rotate' && <IssueDeviceJoinKeyDialog device={device} rotate onClose={() => setChoice(undefined)} />}
    </>
  )
}

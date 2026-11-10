import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { Button, Link, Stack } from '@mui/material'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { disabledWhen } from '../hooks/useDeviceDisable'
import { AddDuplicateDeviceDialog, DuplicateTarget } from './AddDuplicateDeviceDialog'
import { IssueDeviceJoinKeyDialog } from './IssueDeviceJoinKeyDialog'
import { Notice } from './Notice'

/* A device flagged as held by another machine too (Device.duplicate; graphql-api docs/PROXY-GROUPS.md §11, "Duplicate
   devices"). Its device join key on a second machine (kind device-join-key): the copy is refused quietly while the
   owner chooses — keep the copy as a new device or make it the original, each a new device whose key goes on that
   machine, or neither, rotating the device's keys. Once a new device is made for the other machine (its `replacement`),
   the page waits for that key's first boot, rotation still offered. A daemon that cannot take an identity of its own
   (kind key): refused, with nothing to choose until it is updated. */
export const DuplicateKeyNotice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const served = useDeviceIdentity()
  const [choice, setChoice] = useState<DuplicateTarget | 'rotate'>()

  const flag = device.duplicate
  if (!flag) return null

  // When it was last seen, and from where: the other machine's address, and roughly where that is.
  const when = disabledWhen(flag.seen ?? flag.since)
  const where = [flag.address, flag.place && `(${flag.place})`].filter(Boolean).join(' ')
  const seen =
    when && where
      ? t('duplicateKey.seenFrom', { when, where, defaultValue: 'Seen {{when}} from {{where}}.' })
      : when
      ? t('duplicateKey.seen', { when, defaultValue: 'Seen {{when}}.' })
      : where
      ? t('duplicateKey.from', { where, defaultValue: 'From {{where}}.' })
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
  const replacement = flag.replacement
  const add = manage && !!served?.addDuplicateDevice && !replacement
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
                  {replacement
                    ? t('duplicateKey.rotateToo', 'Rotate keys too')
                    : t('duplicateKey.rotate', 'Neither: rotate keys')}
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
          {replacement ? (
            <>
              <Link component={RouterLink} to={`/devices/${replacement.id}`} color="inherit">
                {replacement.name || replacement.id}
              </Link>{' '}
              {t('duplicateKey.waiting', {
                name: device.name,
                defaultValue:
                  'was made for the other machine: install its key there and restart it. Until it first starts, whichever machine is online first is {{name}}, and the other stays refused.',
              })}
            </>
          ) : (
            t('duplicateKey.body', {
              name: device.name,
              defaultValue:
                'Whichever machine is online first is {{name}}; the other is refused quietly until you choose: keep the copy as a new device, make it the original — each a new device whose key you install on that machine — or neither, rotating the keys so the copy cannot sign in at all.',
            })
          )}
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

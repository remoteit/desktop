import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link as RouterLink, useHistory } from 'react-router-dom'
import { Button, Checkbox, FormControlLabel, Link, Stack, Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { requestDuplicateCopies } from '../services/deviceIdentity'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { disabledWhen, useCanDecommission } from '../hooks/useDeviceDisable'
import { DecommissionDialog } from './DecommissionDialog'
import { Confirm } from './Confirm'
import { Notice } from './Notice'

/* A copy's page (graphql-api docs/PROXY-GROUPS.md §11, "A duplicate of a device that keeps its own key"): a machine
   that signed in as X while X was online, split off as this device and disabled — no access, no licence — until its
   owner chooses: keep it as a new device (from X's setup by default), leave it disabled or remove it, or make it the
   original, the two machines swapping. */
export const DuplicateCopyNotice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const served = useDeviceIdentity()
  const canDecommission = useCanDecommission(device)
  const destroying = useSelector((state: State) => state.ui.destroying)
  const [choice, setChoice] = useState<'keep' | 'original' | 'remove'>()
  const [fromOriginal, setFromOriginal] = useState(true)
  const [reason, setReason] = useState<string>()

  const original = device.duplicateOf
  if (!original) return null

  const manage = device.permissions.includes('MANAGE')
  const name = original.name || original.id
  const when = disabledWhen(device.disabledAt)

  const decide = async (action: 'keep' | 'original') => {
    setChoice(undefined)
    setReason(undefined)
    const refused =
      action === 'keep'
        ? await dispatch.devices.keepDuplicates({ ids: [device.id], fromOriginal })
        : await dispatch.devices.makeOriginal({ id: device.id, originalId: original.id })
    if (refused !== undefined) setReason(refused || t('duplicateCopy.notChanged', 'Nothing was changed.'))
  }

  const keep = manage && !!served?.keepDuplicate
  const swap = manage && !!served?.makeOriginal

  return (
    <>
      <Notice
        gutterTop
        severity="warning"
        button={
          (keep || swap || canDecommission) && (
            <Stack spacing={1} alignItems="stretch" sx={{ marginY: 0.5, minWidth: 180 }}>
              {keep && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  disabled={destroying}
                  onClick={() => setChoice('keep')}
                >
                  {t('duplicateCopy.keep', 'Keep as new device')}
                </Button>
              )}
              {swap && (
                <Button size="small" color="warning" disabled={destroying} onClick={() => setChoice('original')}>
                  {t('duplicateCopy.makeOriginal', 'Make it the original')}
                </Button>
              )}
              {canDecommission && (
                <Button size="small" color="error" disabled={destroying} onClick={() => setChoice('remove')}>
                  {t('duplicateCopy.remove', 'Remove…')}
                </Button>
              )}
            </Stack>
          )
        }
      >
        <strong>
          {t('duplicateCopy.title', 'Duplicate of')}{' '}
          <Link component={RouterLink} to={`/devices/${original.id}`} color="inherit">
            {name}
          </Link>
        </strong>
        <em>
          {when
            ? t('duplicateCopy.splitWhen', {
                name,
                when,
                defaultValue:
                  'This machine signed in as {{name}} while {{name}} was online, and was split off {{when}}.',
              })
            : t('duplicateCopy.split', {
                name,
                defaultValue: 'This machine signed in as {{name}} while {{name}} was online, and was split off.',
              })}{' '}
          {t(
            'duplicateCopy.disabled',
            'It is disabled — no access, no licence — and idles quietly until you keep it, make it the original, or remove it.'
          )}
        </em>
        {reason && <em data-refusal>{reason}</em>}
      </Notice>
      <Confirm
        open={choice === 'keep'}
        title={t('duplicateCopy.keepTitle', { name: device.name, defaultValue: 'Keep "{{name}}" as a new device?' })}
        action={t('duplicateCopy.keepAction', 'Keep')}
        maxWidth="sm"
        onConfirm={() => decide('keep')}
        onDeny={() => setChoice(undefined)}
      >
        <Typography variant="body2" gutterBottom>
          {t('duplicateCopy.keepBody', {
            name,
            defaultValue: 'It is enabled as a device of its own and takes a licence. {{name}} is unchanged.',
          })}
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={fromOriginal} onChange={event => setFromOriginal(event.target.checked)} />}
          label={t('duplicateCopy.fromOriginal', {
            name,
            defaultValue: 'Start from the setup of {{name}}: its services, tags and product',
          })}
        />
      </Confirm>
      <Confirm
        open={choice === 'original'}
        title={t('duplicateCopy.originalTitle', { name: device.name, defaultValue: 'Make "{{name}}" the original?' })}
        action={t('duplicateCopy.originalAction', 'Swap')}
        maxWidth="sm"
        onConfirm={() => decide('original')}
        onDeny={() => setChoice(undefined)}
      >
        <Typography variant="body2" gutterBottom>
          {t('duplicateCopy.originalBody', {
            name,
            copy: device.name,
            defaultValue:
              'The two machines swap. This machine becomes {{name}}, with its ID, settings, access and history; the machine that is {{name}} now becomes {{copy}}, disabled until you decide.',
          })}
        </Typography>
        <Typography variant="body2">
          {t(
            'duplicateCopy.originalWhen',
            'It happens at once where both are online, otherwise as each next signs in.'
          )}
        </Typography>
      </Confirm>
      <DecommissionDialog
        open={choice === 'remove'}
        devices={[device]}
        onClose={() => setChoice(undefined)}
        onDone={() => {
          requestDuplicateCopies(device.accountId, true)
          history.push(`/devices/${original.id}`)
        }}
      />
    </>
  )
}

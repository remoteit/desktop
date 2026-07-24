import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Typography, Button } from '@mui/material'
import { TransferForm } from './TransferForm'
import { getAllDevices } from '../../selectors/devices'
import { selectContacts } from '../../selectors/contacts'
import { useGuests } from '../../hooks/useGuests'
import { Redirect, useHistory } from 'react-router-dom'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'

export const DeviceBulkTransferPage: React.FC = () => {
  const { t } = useTranslation()
  const contacts = useSelector(selectContacts)
  const transferring = useSelector((state: State) => state.ui.transferring)
  const selected = useSelector((state: State) => state.ui.selected)
  useGuests()
  // Resolve against the same pool as the transferSelected thunk (selectDevice → getAllDevices)
  const allDevices = useSelector(getAllDevices)
  const history = useHistory()
  const { devices } = useDispatch<Dispatch>()

  const deviceLookup = useMemo(() => new Map(allDevices.map(d => [d.id, d])), [allDevices])
  const selectedDevices = selected.map(id => deviceLookup.get(id)).filter((d): d is IDevice => !!d)
  const blocked = selectedDevices.filter(d => d.shared || !d.permissions.includes('MANAGE'))
  const count = selected.length
  const canTransfer = !blocked.length

  const onTransfer = async (email: string) => {
    const ok = await devices.transferSelected({ deviceIds: selected, email })
    if (ok) history.push('/devices')
  }

  if (!count) return <Redirect to="/devices" />

  return (
    <TransferForm
      title={t('deviceBulkTransferPage.title', 'Transfer Devices')}
      contacts={contacts}
      transferring={transferring}
      disabled={!canTransfer}
      notice={
        !canTransfer && (
          <Notice
            severity="warning"
            fullWidth
            button={
              <Button size="small" variant="contained" color="warning" onClick={() => history.goBack()}>
                <Icon name="arrow-left" size="sm" color="alwaysWhite" inlineLeft />{' '}
                {t('deviceBulkTransferPage.goBack', 'Go Back')}
              </Button>
            }
          >
            {t('deviceBulkTransferPage.blockedCount', {
              count: blocked.length,
              defaultValue_one: '{{count}} of the selected device cannot be transferred.',
              defaultValue_other: '{{count}} of the selected devices cannot be transferred.',
            })}
            <em>
              {t('deviceBulkTransferPage.blockedNames', {
                names: blocked.map(d => d.name).join(', '),
                defaultValue: 'You can only transfer devices you own: {{names}}.',
              })}
            </em>
          </Notice>
        )
      }
      description={
        <>
          <Typography variant="body2" gutterBottom>
            {t('deviceBulkTransferPage.transferringCount', {
              count,
              defaultValue_one: 'You are transferring {{count}} device to a new owner.',
              defaultValue_other: 'You are transferring {{count}} devices to a new owner.',
            })}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t(
              'deviceBulkTransferPage.transferInfo',
              'Device transfer typically takes a few seconds to complete. An email will be sent to you and the new owner when the process is completed.'
            )}
          </Typography>
        </>
      }
      confirmContent={email => (
        <>
          <Notice severity="error" gutterBottom fullWidth>
            {t('deviceBulkTransferPage.confirmWarning', 'You will lose all access and control of these devices upon transfer.')}
          </Notice>
          <Typography variant="body2">
            {t('deviceBulkTransferPage.confirmOwnershipBefore', 'You are about to transfer ownership of')}{' '}
            <b>
              {t('deviceBulkTransferPage.deviceCount', {
                count,
                defaultValue_one: '{{count}} device',
                defaultValue_other: '{{count}} devices',
              })}
            </b>{' '}
            {t('deviceBulkTransferPage.confirmOwnershipMiddle', 'and all of their services to')}
            <b> {email}</b>.
          </Typography>
        </>
      )}
      onTransfer={onTransfer}
    />
  )
}

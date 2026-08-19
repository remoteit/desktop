import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Dispatch, State } from '../../store'
import { Typography } from '@mui/material'
import { TransferForm } from './TransferForm'
import { selectContacts } from '../../selectors/contacts'
import { useGuests } from '../../hooks/useGuests'
import { Notice } from '../../components/Notice'

type Props = { device?: IDevice }

export const DeviceTransferPage: React.FC<Props> = ({ device }) => {
  const { t } = useTranslation()
  const contacts = useSelector(selectContacts)
  const transferring = useSelector((state: State) => state.ui.transferring)
  const { devices } = useDispatch<Dispatch>()
  useGuests()

  if (!device) return null

  return (
    <TransferForm
      title={t('deviceTransferPage.title', 'Transfer Device')}
      contacts={contacts}
      transferring={transferring}
      description={
        <>
          <Typography variant="body2" gutterBottom>
            {t('deviceTransferPage.transferringTo', {
              name: device.name,
              defaultValue: 'You are transferring "{{name}}" to a new owner.',
            })}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t(
              'deviceTransferPage.transferInfo',
              'Device transfer typically takes a few seconds to complete. An email will be sent to you and the new owner when the process is completed.'
            )}
          </Typography>
        </>
      }
      confirmContent={email => (
        <>
          <Notice severity="error" gutterBottom fullWidth>
            {t(
              'deviceTransferPage.loseAccessWarning',
              'You will lose all access and control of this device upon transfer.'
            )}
          </Notice>
          <Typography variant="body2">
            {t('deviceTransferPage.confirmTransferPrefix', 'You are about to transfer ownership of')} <b>{device.name}</b>{' '}
            {t('deviceTransferPage.confirmTransferSuffix', 'and all of its services to')}
            <b> {email}</b>.
          </Typography>
        </>
      )}
      onTransfer={email => devices.transferDevice({ device, email })}
    />
  )
}

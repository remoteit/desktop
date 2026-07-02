import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Typography } from '@mui/material'
import { TransferForm } from './TransferForm'
import { selectContacts } from '../../selectors/contacts'
import { Notice } from '../../components/Notice'

type Props = { device?: IDevice }

export const DeviceTransferPage: React.FC<Props> = ({ device }) => {
  const contacts = useSelector(selectContacts)
  const transferring = useSelector((state: State) => state.ui.transferring)
  const { devices } = useDispatch<Dispatch>()

  if (!device) return null

  return (
    <TransferForm
      title="Transfer Device"
      contacts={contacts}
      transferring={transferring}
      description={
        <>
          <Typography variant="body2" gutterBottom>
            You are transferring "{device.name}" to a new owner.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Device transfer typically takes a few seconds to complete. An email will be sent to you and the new owner
            when the process is completed.
          </Typography>
        </>
      }
      confirmContent={email => (
        <>
          <Notice severity="error" gutterBottom fullWidth>
            You will lose all access and control of this device upon transfer.
          </Notice>
          <Typography variant="body2">
            You are about to transfer ownership of <b>{device.name}</b> and all of its services to
            <b> {email}</b>.
          </Typography>
        </>
      )}
      onTransfer={email => devices.transferDevice({ device, email })}
    />
  )
}

import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Typography } from '@mui/material'
import { TransferForm } from './TransferForm'
import { getAllDevices } from '../../selectors/devices'
import { Redirect, useHistory } from 'react-router-dom'
import { Notice } from '../../components/Notice'

export const DeviceBulkTransferPage: React.FC = () => {
  const { contacts = [], transferring, selected } = useSelector((state: State) => ({
    contacts: state.contacts.all,
    transferring: state.ui.transferring,
    selected: state.ui.selected,
  }))
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
      title="Transfer Devices"
      contacts={contacts}
      transferring={transferring}
      disabled={!canTransfer}
      notice={
        !canTransfer && (
          <Notice severity="warning" fullWidth>
            {blocked.length} of the selected device{blocked.length === 1 ? '' : 's'} cannot be transferred.
            <em>You can only transfer devices you own. Go back and deselect: {blocked.map(d => d.name).join(', ')}.</em>
          </Notice>
        )
      }
      description={
        <>
          <Typography variant="body2" gutterBottom>
            You are transferring {count} device{count === 1 ? '' : 's'} to a new owner.
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
            You will lose all access and control of these devices upon transfer.
          </Notice>
          <Typography variant="body2">
            You are about to transfer ownership of{' '}
            <b>
              {count} device{count === 1 ? '' : 's'}
            </b>{' '}
            and all of their services to
            <b> {email}</b>.
          </Typography>
        </>
      )}
      onTransfer={onTransfer}
    />
  )
}

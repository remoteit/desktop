import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../../store'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../../components/ContactSelector'
import { getDevices } from '../../selectors/devices'
import { Redirect, useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'

export const DeviceBulkTransferPage: React.FC = () => {
  const { contacts = [], transferring, selected } = useSelector((state: State) => ({
    contacts: state.contacts.all,
    transferring: state.ui.transferring,
    selected: state.ui.selected,
  }))
  const devices = useSelector(getDevices)
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  const [email, setEmail] = useState<string | undefined>()
  const { devices: deviceActions } = useDispatch<Dispatch>()

  const count = selected.length
  const selectedDevices = selected.map(id => devices.find(d => d.id === id)).filter((d): d is IDevice => !!d)
  const blocked = selectedDevices.filter(d => d.shared || !d.permissions.includes('MANAGE'))
  const canTransfer = !blocked.length

  const handleChange = (emails: string[]) => {
    setEmail(emails.length > 0 ? emails[0] : undefined)
  }
  const onCancel = () => history.goBack()
  const onTransfer = async () => {
    if (!email || !canTransfer) return
    const ok = await deviceActions.transferSelected({ deviceIds: selected, email })
    if (ok) history.push('/devices')
  }

  if (!count) return <Redirect to="/devices" />

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">Transfer Devices</Typography>
          <Gutters top={null}>
            <ContactSelector
              contacts={contacts}
              selected={email ? [email] : []}
              onSelect={handleChange}
              isMulti={false}
            />
          </Gutters>
        </>
      }
    >
      {!canTransfer && (
        <Gutters bottom={null}>
          <Notice severity="warning" fullWidth>
            {blocked.length} of the selected device{blocked.length === 1 ? '' : 's'} cannot be transferred.
            <em>
              You can only transfer devices you own. Go back and deselect:{' '}
              {blocked.map(d => d.name).join(', ')}.
            </em>
          </Notice>
        </Gutters>
      )}
      <Gutters>
        <Typography variant="body2" gutterBottom>
          You are transferring {count} device{count === 1 ? '' : 's'} to a new owner.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Device transfer typically takes a few seconds to complete. An email will be sent to you and the new owner when
          the process is completed.
        </Typography>
      </Gutters>
      <Gutters top="xl">
        <Button
          color="primary"
          onClick={() => setOpen(true)}
          disabled={!email || !canTransfer || transferring}
          variant="contained"
        >
          {transferring ? 'Transferring...' : 'Transfer'}
        </Button>
        <Button disabled={transferring} onClick={onCancel}>
          Cancel
        </Button>
      </Gutters>
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          onTransfer()
        }}
        onDeny={() => setOpen(false)}
        color="error"
        title="Are you sure?"
        action="Transfer"
      >
        <Notice severity="error" gutterBottom fullWidth>
          You will lose all access and control of these devices upon transfer.
        </Notice>
        <Typography variant="body2">
          You are about to transfer ownership of <b>{count} device{count === 1 ? '' : 's'}</b> and all of their services
          to
          <b> {email}</b>.
        </Typography>
      </Confirm>
    </Container>
  )
}

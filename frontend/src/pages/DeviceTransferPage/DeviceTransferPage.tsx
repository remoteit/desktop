import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../../components/ContactSelector'
import { useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'

type Props = { device?: IDevice }

export const DeviceTransferPage: React.FC<Props> = ({ device }) => {
  const { contacts = [], transferring } = useSelector((state: ApplicationState) => ({
    contacts: state.contacts.all,
    transferring: state.ui.transferring,
  }))
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | undefined>()
  const { devices } = useDispatch<Dispatch>()

  const handleChange = (emails: string[]) => {
    setSelected(undefined)
    if (emails.length > 0) {
      setSelected(emails[0])
    }
  }
  const onCancel = () => history.goBack()
  const onTransfer = () => devices.transferDevice({ device, email: selected })

  if (!device) return null

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">Transfer Device</Typography>
          <Gutters top={null}>
            <ContactSelector
              contacts={contacts}
              selected={selected ? [selected] : []}
              onSelect={handleChange}
              isMulti={false}
            />
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Typography variant="body2" gutterBottom>
          Your are transferring "{device.name}" to a new owner.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Device transfer typically takes a few seconds to complete. An email will be sent to you and the new owner when
          the process is completed.
        </Typography>
      </Gutters>
      <Gutters top="xl">
        <Button color="primary" onClick={() => setOpen(true)} disabled={!selected || transferring} variant="contained">
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
        title="Are you sure?"
        action="Transfer"
      >
        <Notice severity="danger" gutterBottom fullWidth>
          You will lose all access and control of this device upon transfer.
        </Notice>
        <Typography variant="body2">
          You are about to transfer ownership of <b>{device.name}</b> and all of its services to
          <b> {selected}</b>.
        </Typography>
      </Confirm>
    </Container>
  )
}

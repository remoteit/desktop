import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, makeStyles } from '@material-ui/core'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { useHistory } from 'react-router-dom'
import { TransferSaveActions } from '../../components/TransferSaveActions'
import { ContactSelector } from '../../components/ContactSelector'
import { Confirm } from '../../components/Confirm'

type Props = {
  targetDevice: ITargetDevice
  device?: IDevice
}

export const DeviceTransferPage: React.FC<Props> = ({ targetDevice, device }) => {
  const {
    contacts = [],
    contactToTransfer,
    transfering
  } = useSelector((state: ApplicationState) => ({
    contacts: state.devices.contacts,
    contactToTransfer: state.devices.contactToTransfer,
    transfering: state.devices.transfering
  }))
  const history = useHistory()
  const css = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const [selectedContact, setSelectedContact] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()



  const handleChange = (emails: string[]) => {
    setSelectedContact(false)
    if (emails.length > 0) {
      setSelectedContact(true)
      devices.set({ contactToTransfer: emails[0] })
    }
  }

  const onCancel = () => {
    history.goBack()
  }

  const onTransfer = () => {
    device && devices.transferDevice({ device, email: contactToTransfer })
    transfering === false && history.push('/')
  }

  if (!device) return null

  return (
    <Container gutterBottom header={<Typography variant="h1">Transfer Device</Typography>}>
      <Gutters>
        <Typography variant="body1">Your are transfering device <b>"{device.name}"</b> to a new owner.</Typography>

      </Gutters>
      <Gutters>
        <ContactSelector
          contacts={contacts}
          selected={contacts.filter(c => device.access.find(s => s.email === c.email))}
          onChange={handleChange}
          isTransfer={true}
        />
      </Gutters>
      <Gutters>
        <Typography variant="body1">Device transfer typically takes a few seconds to complete. An email will be sent to you
          and the new owner when the process is completed.</Typography>

      </Gutters>
      <Gutters className={css.flex}>
        <TransferSaveActions disabled={!selectedContact} onCancel={onCancel} onSave={() => setOpen(true)} />
      </Gutters>
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          onTransfer()
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
        type='transfer'
      >
        <Typography variant="body1">You are about to transfer ownership of device <b>"{device.name}"</b>  and all of its services
          to <b>{contactToTransfer}</b>. This action is permanent and cannot be reversed.</Typography>
      </Confirm>
    </Container>
  )
}

const useStyles = makeStyles({
  input: { '& .MuiInputBase-input': { minHeight: '10rem' } },
  flex: { display: 'flex', justifyContent: 'space-between' },
})

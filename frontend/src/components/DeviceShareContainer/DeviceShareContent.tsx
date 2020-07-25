import { Box } from '@material-ui/core'
import React from 'react'
import { DeviceShareDetails, SharingDetails } from './DeviceShareDetails'
import { DeviceShareAdd } from './DeviceShareAdd'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'

interface DeviceShareContentProps {
  username: string
  device: IDevice
  share: (share: SharingDetails) => Promise<void>
  update: (share: SharingDetails) => Promise<void>
  saving: boolean
}

export function DeviceShareContent({
  username,
  device,
  share,
  update,
  saving
}: DeviceShareContentProps): JSX.Element {
  const { contacts = []} = useSelector((state: ApplicationState) => state.devices)
  const [selectedScripting] = React.useState<boolean>(false)
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([])
  const [selectedServices] = React.useState<string[]>([])

  const handleShare = async (shareDevice: SharingDetails) => {
    await share(shareDevice)
  }

  const handleChangeContacts = (contacts: string[]) => {
    setSelectedContacts(contacts)
  }

  const handleUpdate = async (share: SharingDetails) => {
    await update(share)
  }

  const notSharedYet = (c: { email: string }) => !device.access.find(s => s.email === c.email)
  const unsharedContacts = contacts.filter(notSharedYet)
  return (
    <>
      {username === '' && (
        <Box mb={6}>
          <DeviceShareAdd
            contacts={unsharedContacts}
            onChangeContacts={handleChangeContacts}
            selectedContacts={selectedContacts}
          />
        </Box>
      )}
      <DeviceShareDetails
        device={device}
        share={handleShare}
        selectedScripting={selectedScripting}
        selectedServices={selectedServices}
        selectedContacts={selectedContacts}
        updateSharing={handleUpdate}
        saving={saving}
      />
    </>
  )
}

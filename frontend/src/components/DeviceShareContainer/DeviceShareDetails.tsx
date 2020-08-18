import React from 'react'
import { List } from '@material-ui/core'
import { ContactCard } from './ContactCard'
import { useParams } from 'react-router-dom'
import { getDetailUserPermission } from '../../models/devices'
import { SharingDetails } from './SharingForm'

export function DeviceShareDetails({
  device,
  share,
  selectedContacts,
  updateSharing,
}: {
  device: IDevice
  share: (share: SharingDetails, isNew: boolean) => Promise<void>
  selectedContacts: string[]
  updateSharing: (share: SharingDetails, isNew: boolean) => Promise<void>,
}): JSX.Element {
  const { email = '' } = useParams()

  const formComponent = (email: string, sharedService?: string[], scripting?: boolean,) => {
    return (
      <ContactCard
        device={device}
        share={share}
        scripting={scripting || false}
        sharedServices={sharedService}
        selectedContacts={selectedContacts}
        email={email}
        updateSharing={updateSharing}
      />
    )
  }

  const detailByEmail = (email: string) => {
    const detail = getDetailUserPermission(device, email)
    return formComponent(email, detail.services.map(s => s.id), detail.scripting)
  }

  return (
    <List component="div">
      {email === ''
        ? formComponent('')
        : detailByEmail(email)}
    </List>
  )
}

import React from 'react'
import { List } from '@material-ui/core'
import { ContactCard } from './ContactCard'
import { useParams } from 'react-router-dom'
import { getDetailUserPermission } from '../../models/devices'
import { SharingDetails } from './SharingForm'

export function DeviceShareDetails({
  device,
  share,
  selectedScripting,
  selectedServices,
  selectedContacts,
  updateSharing,
  saving
}: {
  device: IDevice
  share: (share: SharingDetails) => Promise<void>
  selectedScripting: boolean
  selectedServices: string[]
  selectedContacts: string[]
  updateSharing: (share: SharingDetails) => Promise<void>,
  saving: boolean
}): JSX.Element {
  const { userName = '' } = useParams()

  const formComponent = (email: string, sharedService: string[], scripting?: boolean,) => {
    return (
      <ContactCard
        device={device}
        share={share}
        scripting={scripting || false}
        sharedServices={sharedService}
        selectedContacts={selectedContacts}
        email={email}
        updateSharing={updateSharing}
        saving={saving}
      />
    )
  }

  const detailByEmail = (email: string) => {
    const detail = getDetailUserPermission(device, email)
    return formComponent(email, detail.services.map(s => s.id), detail.scripting)
  }

  return (
    <List component="div">
      {userName === ''
        ? formComponent('', selectedServices, selectedScripting)
        : detailByEmail(userName)}
    </List>
  )
}

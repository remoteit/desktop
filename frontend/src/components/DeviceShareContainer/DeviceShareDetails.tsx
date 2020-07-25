import React from 'react'
import { List } from '@material-ui/core'
import { ContactCard } from './ContactCard'
import { useParams } from 'react-router-dom'
import { service } from '../../helpers/mockData'

export interface SharingDetails {
  access: SharingAccess
  contacts: string[]
  deviceID?: string
}

export interface SharingAccess {
  scripting: boolean
  services: string[]
}

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

  return (
    <List component="div">
      {userName === ''
        ? formComponent('', selectedServices, selectedScripting)
        : device?.access.map((s) =>  { 
            if (userName === s.email) {
             const servicesUser = device.services.filter(service => service.access && service.access.find(_ac => _ac.email === userName))
                .map(service => service.id)
             return formComponent(s.email, servicesUser, s.scripting,)
            }
        })}
    </List>
  )
}

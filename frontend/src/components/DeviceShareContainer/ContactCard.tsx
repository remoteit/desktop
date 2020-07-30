import React, { Suspense } from 'react'
import { LoadingMessage } from '../LoadingMessage'
import { SharingForm, SharingDetails, SharingAccess } from './SharingForm'

export function ContactCard({
  device,
  share,
  scripting,
  sharedServices,
  selectedContacts,
  email,
  updateSharing,
  saving
}: {
  device: IDevice
  share: (access: SharingDetails) => Promise<void>
  scripting: boolean
  sharedServices: string[]
  selectedContacts: string[]
  email: string
  updateSharing: (access: SharingDetails) => void
  saving: boolean
}): JSX.Element {
  const [scripts, setScripts] = React.useState<boolean>(scripting)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(sharedServices)

  const  handleChange = (access: SharingAccess) => {
    setScripts(access.scripting)
    setSelectedServices(access.services)
  }

  const handleSharingUpdate = () => {
    updateSharing({
      access: {
        scripting: scripts,
        services: selectedServices,
      },
      contacts: [email],
    })
  }

  const handleShare = () => {
    share({
      access: {
        scripting: scripts,
        services: selectedServices,
      },
      contacts: selectedContacts,
    })
  }

  return (
    <Suspense fallback={<LoadingMessage />}>
      <SharingForm
        device={device}
        saving={saving}
        scripting={scripts}
        onChange={handleChange}
        selectedServices={selectedServices}
        update={handleSharingUpdate}
        share={handleShare}
      />
    </Suspense>
  )
}

import React, { Suspense, useEffect } from 'react'
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
  changing,
  setChanging
}: {
  device: IDevice
  share: (access: SharingDetails, isNew: boolean) => void
  scripting: boolean
  sharedServices: string[]
  selectedContacts: string[]
  email: string
  updateSharing: (access: SharingDetails, isNew: boolean) => void
  changing: boolean
  setChanging: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const [scripts, setScripts] = React.useState<boolean>(scripting)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(sharedServices)

  useEffect(() => {
    setSelectedServices(sharedServices)
  }, [])
  
  const  handleChange = (access: SharingAccess) => {
    setScripts(access.scripting)
    setSelectedServices(access.services)
    setChanging(true)
  }

  const handleSharingUpdate = () => {
    updateSharing({
      access: {
        scripting: scripts,
        services: selectedServices,
      },
      contacts: [email],
    }, false)
  }

  const handleShare = () => {
    share({
      access: {
        scripting: scripts,
        services: selectedServices,
      },
      contacts: selectedContacts,
    }, true)
  }

  return (
    <Suspense fallback={<LoadingMessage />}>
      <SharingForm
        device={device}
        scripting={scripts}
        onChange={handleChange}
        selectedServices={selectedServices}
        update={handleSharingUpdate}
        share={handleShare}
        changing={changing}
      />
    </Suspense>
  )
}

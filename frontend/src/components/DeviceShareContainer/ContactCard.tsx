import React, { Suspense } from 'react'
import { LoadingMessage } from '../LoadingMessage'
import { SharingAccess, SharingDetails } from './DeviceShareDetails'
import { SharingForm } from './SharingForm'

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
  const [unshared, setUnshared] = React.useState<boolean>(false)
  const [scripts, setScripts] = React.useState<boolean>(scripting)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(sharedServices)
  function handleChange(access: SharingAccess): void {
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

  if (unshared) {
    return <></>
  }

  return (
    <Suspense fallback={<LoadingMessage />}>
      <div className="ml-xxl mb-md">
        <SharingForm
          device={device}
          saving={saving}
          scripting={scripts}
          onChange={handleChange}
          selectedServices={selectedServices}
          update={handleSharingUpdate}
          share={handleShare}
        />
      </div>
    </Suspense>
  )
}

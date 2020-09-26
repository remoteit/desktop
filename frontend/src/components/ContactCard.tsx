import React, { useEffect } from 'react'
import { SharingForm, SharingDetails, SharingAccess } from './SharingForm'

export function ContactCard({
  device,
  share,
  scripting,
  sharedServices,
  selected,
  email,
  updateSharing,
  changed,
  setChanged,
}: {
  device: IDevice
  share: (access: SharingDetails, isNew: boolean) => void
  scripting: boolean
  sharedServices: string[]
  selected: string[]
  email: string
  updateSharing: (access: SharingDetails, isNew: boolean) => void
  changed: boolean
  setChanged: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const [scripts, setScripts] = React.useState<boolean>(scripting)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(sharedServices)

  useEffect(() => {
    setSelectedServices(sharedServices)
  }, [])

  const handleChange = (access: SharingAccess) => {
    setScripts(access.scripting)
    setSelectedServices(access.services)
    setChanged(true)
  }

  const handleSharingUpdate = () => {
    updateSharing(
      {
        access: {
          scripting: scripts,
          services: selectedServices,
        },
        contacts: [email],
      },
      false
    )
  }

  const handleShare = () => {
    share(
      {
        access: {
          scripting: scripts,
          services: selectedServices,
        },
        contacts: selected,
      },
      true
    )
  }

  return (
    <SharingForm
      device={device}
      scripting={scripts}
      onChange={handleChange}
      selectedServices={selectedServices}
      update={handleSharingUpdate}
      share={handleShare}
      changed={changed}
    />
  )
}

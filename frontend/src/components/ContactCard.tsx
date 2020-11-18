import React from 'react'
import { SharingForm, SharingDetails, SharingAccess } from './SharingForm'

type Props = {
  device: IDevice
  user?: IUser
  selected: string[]
  onShare: (access: SharingDetails, isNew: boolean) => void
  changed: boolean
  setChanged: React.Dispatch<React.SetStateAction<boolean>>
  scripts: boolean
  setScripts: React.Dispatch<React.SetStateAction<boolean>>
  selectedServices: string[]
  setSelectedServices: React.Dispatch<React.SetStateAction<string[]>>
}

export const ContactCard: React.FC<Props> = ({
  device,
  user,
  selected,
  onShare,
  changed,
  setChanged,
  scripts,
  setScripts,
  selectedServices,
  setSelectedServices,
}) => {
  const handleChange = (access: SharingAccess) => {
    setScripts(access.scripting)
    setSelectedServices(access.services)
    setChanged(true)
  }

  const handleSharingUpdate = () => {
    if (user)
      onShare(
        {
          access: {
            scripting: scripts,
            services: selectedServices,
          },
          emails: [user.email],
        },
        false
      )
  }

  const handleShare = () => {
    onShare(
      {
        access: {
          scripting: scripts,
          services: selectedServices,
        },
        emails: selected,
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

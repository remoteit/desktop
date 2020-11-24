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
  indeterminateServices: string[]
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
  indeterminateServices,
  selectedServices,
  setSelectedServices,
}) => {
  const handleChange = (access: SharingAccess, users: string[]) => {
    setScripts(access.scripting)
    setSelectedServices(access.services)
    if ((users.length || user) && (access.scripting || access.services.length)) {
      setChanged(true)
    }
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
      indeterminateServices={indeterminateServices}
      users={selected}
      update={handleSharingUpdate}
      share={handleShare}
      changed={changed}
    />
  )
}

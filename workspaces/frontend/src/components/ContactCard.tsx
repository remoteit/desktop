import React from 'react'
import { SharingForm, SharingDetails, SharingAccess } from './SharingForm'

type Props = {
  device: IDevice
  user?: IUser
  selected: string[]
  onShare: (access: SharingDetails, isNew: boolean) => void
  changed: boolean
  onChanged: React.Dispatch<React.SetStateAction<boolean>>
  scripts: boolean
  onScripts: React.Dispatch<React.SetStateAction<boolean>>
  indeterminateServices: string[]
  indeterminateScript: boolean
  selectedServices: string[]
  onSelectedServices: React.Dispatch<React.SetStateAction<string[]>>
}

export const ContactCard: React.FC<Props> = ({
  device,
  user,
  selected,
  onShare,
  changed,
  onChanged,
  scripts,
  onScripts,
  indeterminateServices,
  indeterminateScript,
  selectedServices,
  onSelectedServices,
}) => {
  const handleChange = (access: SharingAccess, hasIndeterminate: boolean) => {
    const updatingScript =  access.scripting !== scripts
    updatingScript && onScripts(access.scripting)
    onSelectedServices(access.services)
    onChanged(!hasIndeterminate && (!indeterminateScript || updatingScript))
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
      indeterminateScript={indeterminateScript}
      users={selected}
      update={handleSharingUpdate}
      share={handleShare}
      changed={!changed || ((selected?.length > 0 || !!user) && selectedServices.length > 1)}
    />
  )
}

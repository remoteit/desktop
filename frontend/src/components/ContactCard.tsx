import React, { useEffect } from 'react'
import { SharingForm, SharingDetails, SharingAccess } from './SharingForm'
import { getPermissions } from '../helpers/userHelper'

type Props = {
  device: IDevice
  user?: IUser
  selected: string[]
  onShare: (access: SharingDetails, isNew: boolean) => void
  changed: boolean
  setChanged: React.Dispatch<React.SetStateAction<boolean>>
}

export const ContactCard: React.FC<Props> = ({ device, user, selected, onShare, changed, setChanged }) => {
  const permissions = getPermissions(device, user?.email)
  const services = permissions.services.map(s => s.id)
  const [scripts, setScripts] = React.useState<boolean>(permissions.scripting)
  const [selectedServices, setSelectedServices] = React.useState<string[]>(services)

  useEffect(() => {
    setSelectedServices(services)
  }, [])

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

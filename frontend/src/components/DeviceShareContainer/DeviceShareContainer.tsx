import React, { useState } from 'react'
import { SharingDetails } from './SharingForm'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { DeviceShareAdd } from './DeviceShareAdd'
import { DeviceShareDetails } from './DeviceShareDetails'

export const DeviceShareContainer: React.FC<{ device?: IDevice; email?: string }> = ({ device, email = '' }) => {
  const { shares } = useDispatch<Dispatch>()
  const { contacts = [] } = useSelector((state: ApplicationState) => state.devices)
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([])
  const [changing, setChanging] = useState(false)
  const history = useHistory()
  const location = useLocation()

  if (!device) return null

  const goToNext = () =>
    email === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(location.pathname.replace(`/${email}`, ''))

  const handleShareUpdate = (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share, isNew)
    const { scripting, services } = share.access

    shares.share(shareData)

    shares.updateDeviceState({ device, contacts: shareData.email, scripting, services, isNew })
    goToNext()
  }

  const mapShareData = (share: SharingDetails, isNew: boolean) => {
    const { access } = share
    const scripting = access.scripting
    const services =
      device?.services.map(ser => ({
        serviceId: ser.id,
        action: access.services.includes(ser.id) ? 'ADD' : 'REMOVE',
      })) || []
    const email = isNew ? share.contacts : [share.contacts[0]]

    return {
      deviceId: device.id,
      scripting,
      services,
      email,
    }
  }

  return (
    <>
      {!email && (
        <DeviceShareAdd
          contacts={contacts}
          device={device}
          onChangeContacts={setSelectedContacts}
          selectedContacts={selectedContacts}
          setChanging={setChanging}
        />
      )}
      <DeviceShareDetails
        device={device}
        share={handleShareUpdate}
        selectedContacts={selectedContacts}
        updateSharing={handleShareUpdate}
        changing={changing}
        setChanging={setChanging}
      />
    </>
  )
}

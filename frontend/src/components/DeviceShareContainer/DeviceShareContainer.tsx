import React, { useState } from 'react'
import { SharingDetails } from './SharingForm'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { DeviceShareAdd } from './DeviceShareAdd'
import { DeviceShareDetails } from './DeviceShareDetails'

export const DeviceShareContainer = ({ username = '' }) => {
  const { deviceID = '' } = useParams()
  const { shares } = useDispatch<Dispatch>()
  const myDevice = useSelector((state: ApplicationState) => state.devices.all.find(device => device.id === deviceID))
  const { contacts = [] } = useSelector((state: ApplicationState) => state.devices)
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([])
  const history = useHistory()
  const location = useLocation()
  const [changing, setChanging] = useState(false)

  if (!myDevice) return null

  const goToNext = () =>
    username === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(location.pathname.replace(`/${username}`, ''))

  const handleShareUpdate = (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share, isNew)
    const { scripting, services } = share.access

    shares.share(shareData)

    shares.updateDeviceState({ device: myDevice, contacts: shareData.email, scripting, services, isNew })
    goToNext()
  }

  const mapShareData = (share: SharingDetails, isNew: boolean) => {
    const { access } = share
    const scripting = access.scripting
    const services =
      myDevice?.services.map(ser => ({
        serviceId: ser.id,
        action: access.services.includes(ser.id) ? 'ADD' : 'REMOVE',
      })) || []
    const email = isNew ? share.contacts : [share.contacts[0]]

    return {
      deviceId: deviceID,
      scripting,
      services,
      email,
    }
  }

  return (
    <>
      {!username && (
        <DeviceShareAdd
          contacts={contacts}
          device={myDevice}
          onChangeContacts={setSelectedContacts}
          selectedContacts={selectedContacts}
          setChanging={setChanging}
        />
      )}
      <DeviceShareDetails
        device={myDevice}
        share={handleShareUpdate}
        selectedContacts={selectedContacts}
        updateSharing={handleShareUpdate}
        changing={changing}
        setChanging={setChanging}
      />
    </>
  )
}

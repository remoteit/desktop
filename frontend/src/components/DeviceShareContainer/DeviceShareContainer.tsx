import React from 'react'
import { SharingDetails } from './SharingForm'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { SharingManager } from '../../services/SharingManager'
import { makeStyles } from '@material-ui/core/styles'
import { DeviceShareContent } from './DeviceShareContent'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'

export const DeviceShareContainer = ({ username = '' }) => {
  const { deviceID = '' } = useParams()
  const { devices, shares } = useDispatch<Dispatch>()
  const { myDevice } = useSelector((state: ApplicationState) => ({
    myDevice: state.devices.all.find(device => device.id === deviceID),
  }))

  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  const handleShare = async (share: SharingDetails) => {

    const shareData = mapShareData(share)
    const contacts = share.contacts
    const {scripting, services} = share.access

    await shares.share({...shareData, contacts})

    updateStateDevice(contacts, scripting, services, true)
  }

  const handleUpdate = async (share: SharingDetails) => {

    const shareData = mapShareData(share)
    const email = share.contacts[0]
    const {scripting, services} = share.access

    await shares.update({...shareData, email})

    updateStateDevice([email], scripting, services)
  }

  const mapShareData = (share: SharingDetails) => {
    const { access } = share
    const scripting = access.scripting
    const allServices = myDevice?.services.map(ser => ({...ser, id: ser.id.toLowerCase()})) || []
    const sharedServices = access.services.map(ser => ser.toLowerCase())

    return {
      allServices,
      deviceID,
      scripting,
      sharedServices,
    }
  }

  if (!myDevice) return null

  const updateStateDevice = (contacts: string[], scripting: boolean, services: string[], isNew?: boolean) => {

    const newUsers: IUser[] = contacts.map(email => ({email, scripting}))
    if (isNew) {
      myDevice.access = myDevice.access.concat(newUsers)
    } else {
      myDevice.access = myDevice.access.map(_ac => ({..._ac, scripting}))
    }

    services.length && myDevice.services.map(service => {
      if (!service.access) {
        service.access = []
      }
      service.access = (services.includes(service.id)) ? service.access.concat(newUsers) :
          service.access.filter(_ac => !newUsers.find(user => user.email === _ac.email))
      return service
    })
    devices.updateShareDevice(myDevice)
  
    username === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(`/devices/${deviceID}/users`)
  }

  return (
     <div className={css.shareContainer}>
      <DeviceShareContent
        username={username}
        device={myDevice}
        share={handleShare}
        update={handleUpdate}
        saving={false}
      />
    </div>
  )
}

const useStyles = makeStyles({
  shareContainer: {
    padding: '0px 10px 0px 20px',
  },
  shareContent: {
    marginLeft: '10px',
  },
})

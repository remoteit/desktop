import React from 'react'
import { SharingDetails } from './SharingForm'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Box } from '@material-ui/core'
import { DeviceShareAdd } from './DeviceShareAdd'
import { DeviceShareDetails } from './DeviceShareDetails'
import { spacing } from '../../styling'

export const DeviceShareContainer = ({ username = '' }) => {
  const { deviceID = '' } = useParams()
  const { shares } = useDispatch<Dispatch>()
  const { myDevice } = useSelector((state: ApplicationState) => ({
    myDevice: state.devices.all.find(device => device.id === deviceID),
  }))
  const { contacts = [] } = useSelector((state: ApplicationState) => state.devices)
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([])

  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  if (!myDevice) return null

  const notShared = (c: { email: string }) => !myDevice.access.find(s => s.email === c.email)
  const unsharedContacts = contacts.filter(notShared)

  const goToNext = () => username === ''
    ? history.push(location.pathname.replace('/share', ''))
    : history.push(location.pathname.replace(`/${username}`, '' ))

  const handleShareUpdate = async (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share)
    const contacts = (isNew)
      ? share.contacts
      : [share.contacts[0]]
    const { scripting, services } = share.access

    isNew 
      ? await shares.share({ ...shareData, contacts }) 
      : await shares.update({ ...shareData, email:contacts[0] })

    await shares.updateDeviceState({ device: myDevice, contacts, scripting, services, isNew })
    goToNext()
  }

  const mapShareData = (share: SharingDetails) => {
    const { access } = share
    const scripting = access.scripting
    const allServices = myDevice?.services.map(ser => ({ ...ser, id: ser.id.toLowerCase() })) || []
    const sharedServices = access.services.map(ser => ser.toLowerCase())

    return {
      allServices,
      deviceID,
      scripting,
      sharedServices,
    }
  }

  return (
    <div className={css.shareContainer}>
      {username === '' && (
        <Box mb={6}>
          <DeviceShareAdd
            contacts={unsharedContacts}
            onChangeContacts={setSelectedContacts}
            selectedContacts={selectedContacts}
          />
        </Box>
      )}
      <DeviceShareDetails
        device={myDevice}
        share={handleShareUpdate}
        selectedContacts={selectedContacts}
        updateSharing={handleShareUpdate}
      />
    </div>
  )
}

const useStyles = makeStyles({
  shareContainer: {
    padding: `${spacing.xxs}px ${spacing.sm}px ${spacing.xxs}px ${spacing.md}px`,
  }
})

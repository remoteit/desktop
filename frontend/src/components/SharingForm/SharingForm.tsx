import React, { useEffect, useState } from 'react'
import { Divider, List, ListItem, Typography } from '@material-ui/core'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ServiceCheckboxes } from './ServiceCheckboxes'
import { ShareSaveActions } from '../ShareSaveActions'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useSelector } from '../../hooks/reactReduxHooks'
import { ApplicationState, Dispatch } from '../../store'
import { Notice } from '../Notice'
import { useDispatch } from 'react-redux'

export interface SharingDetails {
  access: SharingAccess
  emails: string[]
  deviceID?: string
}

export interface SharingAccess {
  script: boolean
  services: string[]
}

export function SharingForm({
  device,
  user,
}: {
  device: IDevice
  user?: IUser
}): JSX.Element {
  const history = useHistory()
  const {
    script,
    scriptIndeterminate,
    shareChanged,
    users,
    selected,
    selectedServices,
  } = useSelector((state: ApplicationState) => state.shares.currentDevice || {})

  const location = useLocation()
  const { email = '' } = useParams<{ email: string }>()
  const saving = useSelector((state: ApplicationState) => state.shares.sharing)
  const changed = !shareChanged || ((selected?.length > 0 || !!user) && selectedServices.length > 1)
  const [disabled, setDisabled] = useState<boolean>(!changed || saving)
  const { shares } = useDispatch<Dispatch>()
  const [allowScript, setAllowScript] = useState<boolean>(script)

  const handleChangeServices = (services: string[]) => {
    shares.changeServices(services)
    setDisabled(false)
  }

  useEffect(() => {
    const crumbs = location.pathname.substr(1).split('/')
    crumbs[2] !== 'users' && handleChangeServices([crumbs[2]])
  }, [])

  useEffect(() => {
    setAllowScript(script)
    return () => setDisabled(false)
  }, [script])

  const handleChangeScripting = () => shares.changeScript(!script)

  const mapShareData = (share: SharingDetails, isNew: boolean): IShareProps | undefined => {
    const { access } = share
    const scripting = access.script
    const services =
      device?.services.map((ser: { id: string }) => ({
        serviceId: ser.id,
        action: access.services.includes(ser.id) ? 'ADD' : 'REMOVE',
      })) || []
    const email = isNew ? share.emails : [share.emails[0]]

    if (device) {
      return {
        deviceId: device.id,
        scripting,
        services,
        email,
      }
    }
  }
  const handleShare = async (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share, isNew)
    const { script, services } = share.access
    if (shareData) await shares.share(shareData)
    if (device && shareData) {
      await shares.updateDeviceState({ device, emails: shareData.email, scripting: script, services, isNew })
    }
    goToNext()
  }
  const goToNext = () =>
    email === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(location.pathname.replace(`/${email}`, ''))


  const action = () => {
    let action = false
    let emails: any
    if (email === '') {
      action = true
      emails = users
    } else {
      emails = [user?.email]
    }
    handleShare({
      access: {
        script,
        services: selectedServices,
      },
      emails,
    }, action)
  }

  return (
    <>
      <Typography variant="subtitle1">Services</Typography>
      <ServiceCheckboxes
        onChange={handleChangeServices}
        services={device.services.map(s => ({ label: s.name, value: s.id }))}
        saving={saving}
        selectedServices={selectedServices}
      />
      <Divider />
      <List>
        <ListItemCheckbox
          label="Allow script execution"
          subLabel="Give the user the ability to run scripts on this device."
          disabled={saving}
          checked={allowScript}
          indeterminate={scriptIndeterminate}
          onClick={handleChangeScripting}
        />
      </List>
      {disabled && (
        <List>
          <ListItem>
            <Notice fullWidth>
              <em>
                Please select an option to share.
                If you wish to remove this user click the trash icon at the top.
              </em>
            </Notice>
          </ListItem>
        </List>
      )}
      <ShareSaveActions
        onCancel={() => history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))}
        onSave={action}
        disabled={disabled}
      />
    </>
  )
}




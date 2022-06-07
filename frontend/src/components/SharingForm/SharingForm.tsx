import React, { useEffect, useState } from 'react'
import { Divider, List, Typography, Box } from '@material-ui/core'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ServiceCheckboxes } from './ServiceCheckboxes'
import { ShareSaveActions } from '../ShareSaveActions'
import { TargetPlatform } from '../TargetPlatform'
import { useHistory, useLocation } from 'react-router-dom'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Gutters } from '../Gutters'

export interface SharingDetails {
  access: SharingAccess
  emails: string[]
  deviceID?: string
}

export interface SharingAccess {
  script: boolean
  services: string[]
}

export function SharingForm({ device, user }: { device: IDevice; user?: IUser }): JSX.Element {
  const saving = useSelector((state: ApplicationState) => state.shares.sharing)
  const { script, scriptIndeterminate, users, selectedServices } = useSelector(
    (state: ApplicationState) => state.shares.currentDevice || { script, scriptIndeterminate, users, selectedServices }
  )
  const history = useHistory()
  const location = useLocation()
  const { shares } = useDispatch<Dispatch>()
  const [allowScript, setAllowScript] = useState<boolean>(script)

  const disabled = !users?.length && !user
  const handleChangeServices = (services: string[]) => {
    shares.changeServices(services)
  }

  useEffect(() => {
    const crumbs = location.pathname.substring(1).split('/')
    crumbs[2] !== 'users' && handleChangeServices([crumbs[2]])
  }, [])

  useEffect(() => {
    setAllowScript(script)
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
    if (!shareData) return
    await shares.share(shareData)
    history.goBack()
  }

  const action = () => {
    let action = false
    let emails: string[]
    if (user) {
      emails = [user?.email]
    } else {
      action = true
      emails = users
    }
    handleShare(
      {
        access: {
          script,
          services: selectedServices,
        },
        emails,
      },
      action
    )
  }

  return (
    <>
      <Gutters top="xl">
        <Box display="flex" alignItems="center">
          <TargetPlatform id={device?.targetPlatform} size="xl" inlineLeft />
          <Typography variant="h2">
            {device.name}
            <Typography variant="body2" color="textSecondary">
              Choose the services you'd like to provide access to.
            </Typography>
          </Typography>
        </Box>
      </Gutters>
      <Typography variant="subtitle1">Services</Typography>
      <ServiceCheckboxes
        onChange={handleChangeServices}
        services={device.services.map(s => ({ label: s.name, value: s.id }))}
        saving={saving}
        selectedServices={selectedServices}
      />
      <Divider variant="inset" />
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
      <ShareSaveActions onCancel={() => history.goBack()} onSave={action} disabled={disabled} />
    </>
  )
}

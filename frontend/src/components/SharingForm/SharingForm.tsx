import React, { useEffect, useState } from 'react'
import { Divider, List, Typography, Box } from '@mui/material'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ServiceCheckboxes } from './ServiceCheckboxes'
import { ShareSaveActions } from '../ShareSaveActions'
import { TargetPlatform } from '../TargetPlatform'
import { useHistory } from 'react-router-dom'
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
  const { script, scriptIndeterminate, users, selectedServices, saving } = useSelector((state: ApplicationState) => ({
    ...state.shares.currentDevice,
    script: !!state.shares.currentDevice?.script,
    selectedServices: state.shares.currentDevice?.selectedServices || [],
    saving: state.shares.sharing,
  }))
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [allowScript, setAllowScript] = useState<boolean>(script)

  const disabled = !users?.length && !user
  const handleChangeServices = (services: string[]) => dispatch.shares.setSelectedServices(services)

  useEffect(() => {
    setAllowScript(script)
  }, [script])

  const handleChangeScripting = () => dispatch.shares.setScript(!script)

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
    await dispatch.shares.share(shareData)
    history.goBack()
  }

  const action = () => {
    handleShare({ access: { script, services: selectedServices }, emails: user ? [user?.email] : users || [] }, !user)
  }

  return (
    <>
      <Gutters top="xl">
        <Box display="flex" alignItems="center">
          <TargetPlatform id={device?.targetPlatform} size="xl" inlineLeft />
          <Typography variant="h3">
            {device.name}
            <Typography variant="caption" component="p">
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

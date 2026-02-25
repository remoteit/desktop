import React from 'react'
import { Divider, List, Typography, Box } from '@mui/material'
import { ListItemCheckbox } from '../ListItemCheckbox'
import { ServiceCheckboxes } from './ServiceCheckboxes'
import { ShareSaveActions } from '../ShareSaveActions'
import { TargetPlatform } from '../TargetPlatform'
import { useHistory } from 'react-router-dom'
import { State, Dispatch } from '../../store'
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
  const users = useSelector((state: State) => state.shares.currentDevice?.users)
  const scriptIndeterminate = useSelector((state: State) => !!state.shares.currentDevice?.scriptIndeterminate)
  const selectedServices = useSelector((state: State) => state.shares.currentDevice?.selectedServices || [])
  const script = useSelector((state: State) => !!state.shares.currentDevice?.script)
  const saving = useSelector((state: State) => state.shares.sharing)

  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const disabled = !users?.length && !user
  const handleChangeServices = (services: string[]) => dispatch.shares.setSelectedServices(services)
  const handleChangeScripting = () => dispatch.shares.setScript(!script)

  const mapShareData = (share: SharingDetails, isNew: boolean): IShareProps | undefined => {
    const scripting = share.access.script
    const services =
      device?.services.map((s: { id: string }) => ({
        serviceId: s.id,
        action: share.access.services.includes(s.id) ? 'ADD' : 'REMOVE',
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
          checked={script}
          indeterminate={scriptIndeterminate}
          onClick={handleChangeScripting}
        />
      </List>
      <ShareSaveActions onCancel={() => history.goBack()} onSave={action} disabled={disabled} />
    </>
  )
}

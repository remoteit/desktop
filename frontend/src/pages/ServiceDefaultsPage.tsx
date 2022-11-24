import React from 'react'
import { Typography } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { ServiceHeaderMenu } from '../components/ServiceHeaderMenu'
import { ConnectionDefaultsForm } from '../components/ConnectionDefaultsForm'
import { DeviceContext } from '../services/Context'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Gutters } from '../components/Gutters'

export const ServiceDefaultsPage: React.FC = () => {
  const { device, service } = React.useContext(DeviceContext)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  if (!service || !device) return null

  return (
    <ServiceHeaderMenu device={device} service={service}>
      <Gutters bottom="xxs">
        <Typography variant="subtitle2">Connection Defaults</Typography>
      </Gutters>
      <ConnectionDefaultsForm
        service={service}
        editable={!!device.configurable}
        disabled={!device.permissions.includes('MANAGE')}
        onCancel={() => history.goBack()}
        onSubmit={async form => {
          if (device?.permissions.includes('MANAGE')) {
            service.attributes = { ...service.attributes, ...form.attributes }
            await dispatch.devices.setServiceAttributes(service)
            if (device?.configurable) await dispatch.devices.cloudUpdateService({ form, deviceId: device?.id })
          }
        }}
      />
    </ServiceHeaderMenu>
  )
}

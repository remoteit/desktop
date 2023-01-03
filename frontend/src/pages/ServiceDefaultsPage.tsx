import React from 'react'
import { Box } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { ListItemBack } from '../components/ListItemBack'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { ConnectionDefaultsForm } from '../components/ConnectionDefaultsForm'
import { IconButton } from '../buttons/IconButton'
import { DeviceContext } from '../services/Context'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Notice } from '../components/Notice'
import { Gutters } from '../components/Gutters'

export const ServiceDefaultsPage: React.FC = () => {
  const { device, service } = React.useContext(DeviceContext)
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  if (!service || !device) return null

  return (
    <Gutters size="md" bottom={null}>
      <ListItemBack title="Default Connection settings" />
      <AccordionMenuItem gutters subtitle="Defaults" defaultExpanded disabled>
        <Gutters>
          <Notice fullWidth>Default local settings for any connections to this service.</Notice>
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
      </AccordionMenuItem>
    </Gutters>
  )
}

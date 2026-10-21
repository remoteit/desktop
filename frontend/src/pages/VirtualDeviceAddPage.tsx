import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { Dispatch } from '../store'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { VirtualDeviceForm, VirtualDevicePrefill } from '../components/VirtualDeviceForm'

/* /add/virtual/:gatewayID? — making a virtual device. Reached from Add device (no gateway yet: the form asks), from a
   gateway's Hosted devices, from discovery and from a jump service's menu, each passing what it knows as the route's
   state (VirtualDevicePrefill). */

export const VirtualDeviceAddPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { gatewayID } = useParams<{ gatewayID?: string }>()
  const location = useLocation<VirtualDevicePrefill | undefined>()
  const prefill: VirtualDevicePrefill = { ...location.state, gatewayId: location.state?.gatewayId || gatewayID }

  // The gateways it can go on are the devices loaded so far.
  useEffect(() => {
    dispatch.devices.fetchIfEmpty()
  }, [])

  return (
    <Container
      integrated
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>
            {prefill.fromServiceId
              ? t('virtualDeviceAddPage.convertTitle', 'Make a virtual device')
              : t('virtualDeviceAddPage.title', 'Add virtual device')}
          </Title>
        </Typography>
      }
    >
      <Gutters top={null}>
        <Typography variant="body2" color="textSecondary" maxWidth={560}>
          {t(
            'virtualDeviceAddPage.intro',
            'A NAS, printer, PLC or PC that runs nothing itself, reached through a device on its network. It gets its own services and sharing.'
          )}
        </Typography>
      </Gutters>
      <Gutters size={null} sx={{ maxWidth: 600 }}>
        <VirtualDeviceForm
          key={location.key}
          prefill={prefill}
          onDone={id => history.push(`/devices/${id}`)}
          onCancel={() => history.goBack()}
        />
      </Gutters>
    </Container>
  )
}

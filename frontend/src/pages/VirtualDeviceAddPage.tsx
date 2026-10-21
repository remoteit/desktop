import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { Dispatch } from '../store'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { VirtualDeviceForm, VirtualDevicePrefill } from '../components/VirtualDeviceForm'
import { takeVirtualDevicePrefill } from '../components/HostedDevices'

/* /add/virtual/:gatewayID? — making a virtual device. Reached from Add device (no gateway yet: the form asks), from a
   gateway's Hosted devices, from discovery and from a jump service's menu, each handing over what it knows
   (openVirtualDeviceAdd, a VirtualDevicePrefill). */

export const VirtualDeviceAddPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { gatewayID } = useParams<{ gatewayID?: string }>()
  const [handedOver] = useState(takeVirtualDevicePrefill)
  const prefill: VirtualDevicePrefill = { ...handedOver, gatewayId: handedOver?.gatewayId || gatewayID }

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
          prefill={prefill}
          onDone={id => history.push(`/devices/${id}`)}
          onCancel={() => history.goBack()}
        />
      </Gutters>
    </Container>
  )
}

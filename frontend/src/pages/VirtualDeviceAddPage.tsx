import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory, useParams } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { selectLimits } from '../selectors/organizations'
import { BillingUI } from '../components/BillingUI'
import { Notice } from '../components/Notice'
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
  const room = planRoom(useSelector(selectLimits))

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
              ? t('virtualDeviceAddPage.convertServiceTitle', 'Turn this service into a virtual device')
              : t('virtualDeviceAddPage.title', 'Add virtual device')}
          </Title>
        </Typography>
      }
    >
      <Gutters top={null}>
        <Typography variant="body2" color="textSecondary" maxWidth={560}>
          {t(
            'virtualDeviceAddPage.introGateway',
            'Add a printer, NAS, PLC or PC that can’t run Remote.It. You reach it through a gateway, another device on its network.'
          )}
        </Typography>
      </Gutters>
      {room && (
        <Gutters top={null} sx={{ maxWidth: 600 }}>
          <Box data-device-limit={room.full ? 'full' : 'near'}>
            <Notice
              severity={room.full ? 'warning' : 'info'}
              fullWidth
              button={
                room.full && (
                  <BillingUI>
                    <Button component={Link} to="/account/plans" variant="contained" color="warning" size="small">
                      {t('virtualDeviceAddPage.seePlans', 'See plans')}
                    </Button>
                  </BillingUI>
                )
              }
            >
              {room.full
                ? t('virtualDeviceAddPage.limitReached', {
                    limit: room.limit,
                    have: room.count,
                    defaultValue:
                      'Your plan allows {{limit}} devices and you have {{have}}. A virtual device counts as one, so this one needs a license.',
                  })
                : t('virtualDeviceAddPage.limitNear', {
                    limit: room.limit,
                    next: room.count + 1,
                    defaultValue:
                      'A virtual device counts toward your plan. This one will be device {{next}} of {{limit}}.',
                  })}
            </Notice>
          </Box>
        </Gutters>
      )}
      <Gutters size={null}>
        <VirtualDeviceForm
          prefill={prefill}
          onDone={id => history.push(`/devices/${id}`)}
          onCancel={() => history.goBack()}
        />
      </Gutters>
    </Container>
  )
}

/* How close the account is to its plan's device limit (the iot-devices limit the account already holds): full at or
   over it, near one below it. None where it has room, or no limit. A virtual device counts as a device. */
export function planRoom(limits: ILimit[]): { full: boolean; limit: number; count: number } | undefined {
  const limit = limits.find(l => l.name === 'iot-devices')
  if (!limit || typeof limit.value !== 'number' || limit.value <= 0 || typeof limit.actual !== 'number') return
  if (limit.actual >= limit.value) return { full: true, limit: limit.value, count: limit.actual }
  if (limit.actual === limit.value - 1) return { full: false, limit: limit.value, count: limit.actual }
}

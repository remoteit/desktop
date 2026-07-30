import { Box, Divider, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { Body } from '../../components/Body'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { StatusChip } from '../../components/StatusChip'
import { TargetPlatform } from '../../components/TargetPlatform/TargetPlatform'
import { Timestamp } from '../../components/Timestamp'
import { Title } from '../../components/Title'
import { AdminDevice } from '../../models/adminDevices'
import { Dispatch, State } from '../../store'

const Mono: React.FC<{ value?: string; copy?: boolean }> = ({ value, copy }) => {
  if (!value) return <>—</>
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
        {value}
      </Typography>
      {copy && <CopyIconButton value={value} size="sm" />}
    </Box>
  )
}

const Row: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <>
    <ListItem>
      <ListItemText primary={label} secondary={children ?? '—'} secondaryTypographyProps={{ component: 'div' }} />
    </ListItem>
    <Divider component="li" />
  </>
)

const when = (value?: string) => (value ? <Timestamp date={new Date(value)} /> : undefined)

export const AdminDeviceDetailPage: React.FC = () => {
  const { deviceId = '' } = useParams<{ deviceId?: string }>()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const device: AdminDevice | undefined = useSelector((state: State) => state.adminDevices.detailCache[deviceId])
  const [loading, setLoading] = useState(!device)

  useEffect(() => {
    if (!deviceId) return
    let active = true
    setLoading(true)
    dispatch.adminDevices.fetchDeviceDetail(deviceId).finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [deviceId])

  if (loading && !device) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading device..." />
      </Container>
    )
  }

  if (!device) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Device not found
          </Typography>
        </Body>
      </Container>
    )
  }

  const services = (device.services as IService[]) || []
  const shared = (device.access as { user?: { id?: string; email?: string } }[]) || []
  const geo = device.endpoint?.geo

  const handleOwnerClick = () => {
    const ownerId = device.owner?.id
    if (!ownerId) return
    const route = `/admin/users/${ownerId}`
    dispatch.ui.setDefaultSelected({ key: '/admin/users', value: route, accountId: 'admin' })
    history.push(route)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Box sx={{ padding: 2 }}>
          <Typography variant="h2">
            <Title>{device.name || device.id}</Title>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
            <StatusChip device={{ state: device.state, services } as IDevice} />
            <TargetPlatform id={device.platform} size="md" label />
          </Box>
        </Box>
      }
    >
      <List disablePadding>
        <Row label="Owner">
          {device.owner?.id ? (
            <ListItemButton
              dense
              disableGutters
              onClick={handleOwnerClick}
              sx={{ paddingY: 0, borderRadius: 1, width: 'fit-content' }}
            >
              <Icon name="user" size="sm" color="grayDark" inlineLeft />
              <Typography variant="body2" component="span" color="primary">
                {device.owner.email || device.owner.id}
              </Typography>
              <Icon name="chevron-right" size="sm" color="grayDark" inlineLeft />
            </ListItemButton>
          ) : undefined}
        </Row>
        <Row label="Device ID">
          <Mono value={device.id} copy />
        </Row>
        <Row label="Hardware ID">
          <Mono value={device.hardwareId} copy />
        </Row>
        <Row label="Version">{device.version}</Row>
        <Row label="License">{device.license}</Row>
        <Row label="Created">{when(device.created)}</Row>
        <Row label="Last reported">{when(device.lastReported)}</Row>
        <Row label="Capabilities">
          {[device.configurable && 'configurable', device.scriptable && 'scriptable'].filter(Boolean).join(' • ') ||
            undefined}
        </Row>
        <Row label="External address">
          <Mono value={device.endpoint?.externalAddress} />
        </Row>
        <Row label="Internal address">
          <Mono value={device.endpoint?.internalAddress} />
        </Row>
        <Row label="Location">
          {geo ? [geo.city, geo.stateName, geo.countryName].filter(Boolean).join(', ') || undefined : undefined}
        </Row>
        <Row label="ISP">{geo?.isp}</Row>
        <Row label="Quality">
          {device.endpoint?.quality != null ? `${device.endpoint.quality}` : undefined}
        </Row>
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>Services ({services.length})</Title>
      </Typography>
      <List disablePadding>
        {services.length ? (
          services.map(service => (
            <React.Fragment key={service.id}>
              <ListItem>
                <ListItemText
                  primary={service.name || service.id}
                  secondary={
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <StatusChip service={service} />
                      <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {service.id}
                      </Typography>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText secondary="No services" />
          </ListItem>
        )}
      </List>

      <Typography variant="subtitle1" sx={{ marginTop: 2 }}>
        <Title>Shared with ({shared.length})</Title>
      </Typography>
      <List disablePadding>
        {shared.length ? (
          shared.map((item, index) => (
            <React.Fragment key={item.user?.id || index}>
              <ListItem>
                <ListItemText primary={item.user?.email || item.user?.id} />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText secondary="Not shared" />
          </ListItem>
        )}
      </List>
    </Container>
  )
}

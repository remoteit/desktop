import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Dispatch, State } from '../store'
import { MAX_NAME_LENGTH } from '@common/constants'
import { TargetPlatform } from './TargetPlatform'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { useGateways } from '../hooks/useGateways'
import { isAddressOnly } from '../helpers/virtualDeviceHelper'
import { PlatformChoice, allPlatformChoices, virtualPlatformChoices } from '../platforms/virtual'

/* The one form every way of making a virtual device leads to: from a gateway's page, from what a gateway sees
   (discovery), from Add device, or from a jump service. A prefill says what is known; the person names it, checks its
   address and platform, ticks its services and picks the gateway. Services take the device's address unless they say
   otherwise. */

export type VirtualServiceOffer = IVirtualServiceInput & { checked?: boolean }

export type VirtualDevicePrefill = {
  gatewayId?: string
  name?: string
  host?: string
  addresses?: string[] // every address the host name resolves to, offered as alternatives
  platform?: number // a suggestion (platforms/virtual suggestPlatform)
  services?: VirtualServiceOffer[]
  fromServiceId?: string // a jump service being converted: graphql moves its services (and their shares) over
}

type Props = {
  prefill: VirtualDevicePrefill
  onDone: (deviceId: string) => void
  onCancel: () => void
}

export const VirtualDeviceForm: React.FC<Props> = ({ prefill, onDone, onCancel }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const gateways = useGateways()
  const applicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const [name, setName] = useState(prefill.name || '')
  const [host, setHost] = useState(prefill.host || '')
  const [platform, setPlatform] = useState<number | undefined>(prefill.platform)
  const [more, setMore] = useState(false)
  const [services, setServices] = useState<VirtualServiceOffer[]>(
    (prefill.services || []).map(s => ({ ...s, checked: s.checked ?? true }))
  )
  const [gatewayId, setGatewayId] = useState(prefill.gatewayId || '')
  const [saving, setSaving] = useState(false)
  const [newType, setNewType] = useState<number | ''>('')
  const [newPort, setNewPort] = useState<string>('')

  useEffect(() => {
    if (!applicationTypes.length) dispatch.applicationTypes.fetchAll()
  }, [])

  const converting = !!prefill.fromServiceId
  const gateway = gateways.find(g => g.id === gatewayId)

  // The suggestion first, then the common machine platforms; anything else is under More….
  const choices = useMemo(() => {
    const common = virtualPlatformChoices()
    const all = allPlatformChoices()
    const suggested = prefill.platform !== undefined ? all.find(c => c.type === prefill.platform) : undefined
    const list = suggested ? [suggested, ...common.filter(c => c.type !== suggested.type)] : common
    if (platform !== undefined && !list.some(c => c.type === platform)) {
      const chosen = all.find(c => c.type === platform)
      if (chosen) list.push(chosen)
    }
    return { list, all }
  }, [prefill.platform, platform])

  const addService = () => {
    const type = applicationTypes.find(a => a.id === newType)
    if (!type) return
    const port = Number(newPort) || type.port || 1
    setServices([...services, { name: type.name, application: type.id, port, checked: true }])
    setNewType('')
    setNewPort('')
  }

  const ready = !!name.trim() && !!host.trim() && !!gateway && !saving

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!ready || !gateway) return
    setSaving(true)
    const chosen = services
      .filter(s => s.checked)
      .map(({ checked, ...s }) => ({ ...s, host: s.host && s.host !== host.trim() ? s.host : undefined }))
    const service = converting ? gateway.services.find(s => s.id === prefill.fromServiceId) : undefined
    const id = service
      ? await dispatch.devices.convertJumpService({ gateway, service, name: name.trim(), platform })
      : await dispatch.devices.addVirtualDevice({
          gateway,
          name: name.trim(),
          host: host.trim(),
          platform,
          services: chosen,
        })
    setSaving(false)
    if (id) onDone(id)
  }

  const typeName = (application: number) => applicationTypes.find(a => a.id === application)?.name

  return (
    <form onSubmit={submit}>
      <List>
        <ListItem>
          <TextField
            required
            fullWidth
            autoFocus={!prefill.name}
            label={t('virtualDeviceForm.name', 'Name')}
            value={name}
            variant="filled"
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            onChange={event => setName(event.target.value)}
          />
        </ListItem>
        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <TextField
            required
            fullWidth
            label={t('virtualDeviceForm.address', 'Address')}
            value={host}
            variant="filled"
            disabled={converting}
            placeholder="nas.local"
            InputLabelProps={{ shrink: true }}
            helperText={
              prefill.addresses?.filter(a => a !== host).length
                ? t('virtualDeviceForm.addressAlternatives', {
                    addresses: prefill.addresses.filter(a => a !== host).join(', '),
                    defaultValue: 'or {{addresses}}',
                  })
                : t('virtualDeviceForm.addressHint', 'Its .local name, or its IP address. Its services use it.')
            }
            onChange={event => setHost(event.target.value)}
          />
          {isAddressOnly(host) && (
            <Notice severity="warning" gutterTop>
              {t(
                'virtualDeviceForm.dhcpHint',
                "This address can change if your router assigns a new one. Reserve it in the router's DHCP settings to keep this device reachable."
              )}
            </Notice>
          )}
        </ListItem>
        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            {t('virtualDeviceForm.platform', 'Platform')}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {choices.list.map(choice => (
              <PlatformChip
                key={choice.type}
                choice={choice}
                selected={platform === choice.type}
                suggested={choice.type === prefill.platform}
                onClick={() => setPlatform(platform === choice.type ? undefined : choice.type)}
              />
            ))}
            {!more && (
              <Chip
                label={t('virtualDeviceForm.morePlatforms', 'More…')}
                variant="outlined"
                onClick={() => setMore(true)}
              />
            )}
          </Stack>
          {more && (
            <Autocomplete<PlatformChoice>
              options={choices.all}
              getOptionLabel={option => option.name}
              value={choices.all.find(c => c.type === platform) || null}
              onChange={(_, value) => setPlatform(value?.type)}
              sx={{ marginTop: 1 }}
              renderOption={(props, option) => (
                <li {...props} key={option.type}>
                  <TargetPlatform id={option.type} inlineLeft />
                  {option.name}
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="filled"
                  label={t('virtualDeviceForm.searchPlatforms', 'Any platform')}
                />
              )}
            />
          )}
        </ListItem>
        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <Typography variant="caption" color="textSecondary">
            {t('virtualDeviceForm.services', 'Services')}
          </Typography>
          {converting && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t(
                'virtualDeviceForm.convertHint',
                'These services move from the gateway to the new device, with their shares and grants.'
              )}
            </Typography>
          )}
          <List dense disablePadding>
            {services.map((s, index) => (
              <ListItem key={index} disableGutters dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={!!s.checked}
                    disabled={converting}
                    onChange={event =>
                      setServices(services.map((o, i) => (i === index ? { ...o, checked: event.target.checked } : o)))
                    }
                  />
                </ListItemIcon>
                <ListItemText primary={s.name} />
                <Typography variant="caption" fontFamily="monospace" color="textSecondary">
                  {typeName(s.application) || s.protocol || 'TCP'} :{s.port}
                  {s.host && s.host !== host ? ` · ${s.host}` : ''}
                </Typography>
              </ListItem>
            ))}
          </List>
          {!converting && (
            <Stack direction="row" gap={1} alignItems="center" marginTop={1}>
              <TextField
                select
                size="small"
                variant="filled"
                label={t('virtualDeviceForm.serviceType', 'Add a service')}
                InputLabelProps={{ shrink: true }}
                value={newType}
                sx={{ minWidth: 180 }}
                onChange={event => {
                  const id = Number(event.target.value)
                  setNewType(id)
                  setNewPort(String(applicationTypes.find(a => a.id === id)?.port || ''))
                }}
              >
                {applicationTypes
                  .filter(a => a.port)
                  .map(a => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                size="small"
                variant="filled"
                label={t('virtualDeviceForm.port', 'Port')}
                InputLabelProps={{ shrink: true }}
                value={newPort}
                sx={{ width: 100 }}
                onChange={event => setNewPort(event.target.value.replace(/\D/g, ''))}
              />
              <Button size="small" disabled={newType === ''} onClick={addService}>
                {t('virtualDeviceForm.addService', 'Add')}
              </Button>
            </Stack>
          )}
        </ListItem>
        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <TextField
            select
            required
            fullWidth
            variant="filled"
            label={t('virtualDeviceForm.hostedBy', 'Hosted by')}
            value={gatewayId}
            disabled={converting}
            helperText={t(
              'virtualDeviceForm.hostedByHint',
              'A device on its network that you manage. Sessions reach it through this device.'
            )}
            onChange={event => setGatewayId(event.target.value)}
          >
            {gateways.map(g => (
              <MenuItem key={g.id} value={g.id}>
                <TargetPlatform id={g.targetPlatform} inlineLeft />
                {g.name}
              </MenuItem>
            ))}
          </TextField>
          {!gateways.length && (
            <Notice severity="info" gutterTop>
              {t(
                'virtualDeviceForm.noGateways',
                'No device you manage can host one yet. Install remote.it on a device on its network first.'
              )}
            </Notice>
          )}
        </ListItem>
      </List>
      <Box display="flex" justifyContent="flex-end" gap={1} paddingX={2}>
        <Button onClick={onCancel}>{t('common.cancel', 'Cancel')}</Button>
        <Button type="submit" variant="contained" color="primary" disabled={!ready}>
          {saving
            ? t('virtualDeviceForm.adding', 'Adding…')
            : converting
            ? t('virtualDeviceForm.convert', 'Make virtual device')
            : t('virtualDeviceForm.add', 'Add device')}
        </Button>
      </Box>
    </form>
  )
}

const PlatformChip: React.FC<{
  choice: PlatformChoice
  selected: boolean
  suggested: boolean
  onClick: () => void
}> = ({ choice, selected, suggested, onClick }) => {
  const { t } = useTranslation()
  return (
    <Chip
      icon={selected ? <Icon name="check" type="solid" size="xs" /> : <TargetPlatform id={choice.type} size="sm" />}
      label={
        suggested
          ? t('virtualDeviceForm.suggested', { name: choice.name, defaultValue: '{{name}} · suggested' })
          : choice.name
      }
      color={selected ? 'primary' : undefined}
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
    />
  )
}

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { NAME_MAX, setServiceSubnetName, splitSubnetName, validLabel } from '../services/subnetNames'
import { ListItemCheckbox } from './ListItemCheckbox'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ListItem } from '@mui/material'
import { Notice } from './Notice'

/* A service's own name in device subnets (presence-server docs/subnet-service-names.md): on, the service is reached at
   a name of its own — <name>-<owner slug>.<domain>, one of the account's names beside its devices and LAN hosts —,
   <device><service> unless a person names it, on every port it lists and its usual one: ssh on 22 with no -p, a web
   service on 443. Its name part is edited in place, and can be put back to its default. Applied at once, not with the
   form: graphql decides who may, and whether a name is free — a name taken is refused, and why is shown under the
   field. Absent where the API does not serve device sessions, or does not have service names yet. */
type Props = { device?: IDevice; service?: IService; disabled?: boolean }

export const ServiceSubnetNameSetting: React.FC<Props> = ({ device, service, disabled }) => {
  const { t } = useTranslation()
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? device?.id : undefined)
  const [busy, setBusy] = useState(false)
  const [refused, setRefused] = useState<string>()
  const named = service ? info?.serviceNames?.[service.id] : undefined
  const name = service ? info?.services?.[service.id] : undefined

  if (!enabled || !device || !service || !named) return null

  const locked = disabled || busy || !device.permissions.includes('MANAGE')
  const set = async (on: boolean, label?: string) => {
    setBusy(true)
    setRefused(undefined)
    try {
      const refusal = await setServiceSubnetName(device.id, service.id, on, label)
      if (refusal === undefined) return true
      setRefused(refusal || t('serviceSubnetName.refused', 'This name could not be set'))
      return false
    } finally {
      setBusy(false)
    }
  }
  const shown = named.own && name ? name + (named.port && named.port !== 443 ? `:${named.port}` : '') : undefined
  // Every port its name answers on (presence-server docs/subnet-service-names.md): each it lists, at its own number, and
  // its usual ones to its first port.
  const ports = named.own && named.ports?.length ? named.ports.join(', ') : undefined

  return (
    <>
      <ListItemCheckbox
        checked={named.own}
        disabled={locked}
        label={t('serviceSubnetName.label', 'Its own address')}
        subLabel={
          shown ? (
            <>
              {shown}
              {ports && (
                <>
                  <br />
                  {t('serviceSubnetName.ports', 'Ports: {{ports}}', { ports })}
                </>
              )}
            </>
          ) : (
            t(
              'serviceSubnetName.helpPorts',
              'Reach this service at a name of its own on every port it lists, and on its usual port — ssh on 22, a web page on 443'
            )
          )
        }
        onClick={checked => set(checked)}
      />
      {named.own && name && (
        <InlineTextFieldSetting
          required
          waitForSave
          icon="globe"
          label={t('serviceSubnetName.name', 'Service address')}
          value={splitSubnetName(name).label}
          displayValue={name}
          resetValue={named.defaultLabel || undefined}
          maxLength={NAME_MAX}
          disabled={locked}
          fieldProps={{ InputProps: { readOnly: busy } }}
          validate={value =>
            !validLabel(value)
              ? t('deviceSubnetLabel.problem', 'Lower case letters and digits, at most 29, no dashes')
              : undefined
          }
          helper={value =>
            t('deviceSubnetLabel.hint', '{{name}} — the old name keeps working for 30 days', {
              name: value.trim().toLowerCase() + splitSubnetName(name).rest,
            })
          }
          onSave={value =>
            value.toString().trim().toLowerCase() === splitSubnetName(name).label || set(true, value.toString())
          }
        />
      )}
      {refused && (
        <ListItem>
          <Notice severity="error" fullWidth>
            {refused}
          </Notice>
        </ListItem>
      )}
    </>
  )
}

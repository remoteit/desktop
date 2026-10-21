import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { InlineSelectSetting } from './InlineSelectSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { TargetPlatform } from './TargetPlatform'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { useGateways } from '../hooks/useGateways'
import { isAddressOnly } from '../helpers/virtualDeviceHelper'
import { allPlatformChoices, virtualPlatformChoices } from '../platforms/virtual'
import { gatewayName } from './HostedBy'

/* What a virtual device has of a device's settings beyond its name and description: its platform (chosen by its owner,
   as no daemon reports one), its address, and the gateway that hosts it. Everything else a device sets is a daemon's,
   so it is set on the gateway. */

export const VirtualDeviceSettings: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { devices } = useDispatch<Dispatch>()
  const gateways = useGateways()
  const manage = device.permissions.includes('MANAGE')

  // The common machine platforms first, then the whole catalogue.
  const common = virtualPlatformChoices()
  const commonTypes = new Set(common.map(c => c.type))
  const platformValues: ISelect[] = [...common, ...allPlatformChoices().filter(c => !commonTypes.has(c.type))].map(
    c => ({ key: c.type, name: c.name })
  )
  if (!platformValues.some(v => v.key === device.targetPlatform))
    platformValues.unshift({ key: device.targetPlatform, name: String(device.targetPlatform) })

  // Moving needs MANAGE on the new gateway as well; its current one stays listed even when the viewer cannot see it.
  const current = device.hostedBy
  const gatewayValues: ISelect[] = gateways.map(g => ({ key: g.id, name: g.name }))
  if (current?.id && !gatewayValues.some(v => v.key === current.id))
    gatewayValues.unshift({ key: current.id, name: gatewayName(t, current) })
  if (!current) gatewayValues.unshift({ key: '', name: t('virtualDeviceSettings.notHosted', 'Not hosted') })

  return (
    <>
      <InlineSelectSetting
        label={t('virtualDeviceSettings.platform', 'Platform')}
        icon={<TargetPlatform id={device.targetPlatform} />}
        value={device.targetPlatform}
        values={platformValues}
        disabled={!manage}
        onSave={platform => devices.updateVirtualDevice({ device, set: { platform: Number(platform) } })}
      />
      <InlineTextFieldSetting
        icon="location-dot"
        label={t('virtualDeviceSettings.address', 'Address')}
        value={device.host}
        resetValue={device.host}
        disabled={!manage}
        required
        helper={value =>
          isAddressOnly(value) &&
          t(
            'virtualDeviceSettings.dhcpHint',
            "This address can change if your router assigns a new one. Reserve it in the router's DHCP settings to keep this device reachable."
          )
        }
        onSave={host => devices.updateVirtualDevice({ device, set: { host: host.toString().trim() } })}
      />
      <InlineSelectSetting
        label={t('virtualDeviceSettings.hostedBy', 'Hosted by')}
        icon={<Icon name="arrow-turn-down" rotate={270} size="md" color="grayDarker" />}
        value={current?.id || ''}
        values={gatewayValues}
        disabled={!manage || !gateways.length}
        onSave={id => {
          const gateway = gateways.find(g => g.id === id)
          if (gateway && gateway.id !== current?.id) devices.moveVirtualDevice({ device, gateway })
        }}
      />
      {!current && (
        <Notice severity="warning" gutterTop>
          {t('virtualDeviceSettings.notHostedNotice', 'Not hosted. Choose a gateway to bring it back online.')}
        </Notice>
      )}
    </>
  )
}

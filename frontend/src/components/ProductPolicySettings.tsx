import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, List, Typography } from '@mui/material'
import { ProductSetting, graphQLSetDeviceProductSetting } from '../services/productPolicy'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'
import { Notice } from './Notice'
import { Gutters } from './Gutters'

type Props = {
  productId: string
  settings: ProductSetting[]
  manage: boolean
  onChanged: () => void // read the product again
}

// The settings a product may set on its devices, with the values each takes: on or off, the reflector's modes.
type Offered = { name: string; label: string; icon: string; choices: { key: string; name: string; value: any }[] }

const UNSET = ''

function offered(t: TFunction): Offered[] {
  const onOff = [
    { key: 'on', name: t('productSettings.on', 'On'), value: true },
    { key: 'off', name: t('productSettings.off', 'Off'), value: false },
  ]
  return [
    {
      name: 'services',
      label: t('productSettings.services', 'Share this device'),
      icon: 'network-wired',
      choices: onOff,
    },
    { name: 'subnet', label: t('productSettings.subnet', 'Access'), icon: 'chart-network', choices: onOff },
    { name: 'scripts', label: t('productSettings.scripts', 'Allow scripts'), icon: 'scroll', choices: onOff },
    {
      name: 'websocket',
      label: t('productSettings.websocket', 'Relay'),
      icon: 'arrows-repeat',
      choices: [
        { key: 'auto', name: t('productSettings.websocketAuto', 'Automatic'), value: 'auto' },
        { key: 'on', name: t('productSettings.websocketOn', 'Always'), value: 'on' },
        { key: 'off', name: t('productSettings.websocketOff', 'Off'), value: 'off' },
      ],
    },
  ]
}

// Never a product's: the exit a device goes out through, and Protect, are each device's own at every level.
const APART = ['exit', 'protect']

/* The device settings a product sets (graphql-api docs/PROXY-GROUPS.md §11, wave 4: DeviceProduct.settings and
   setDeviceProductSetting). A setting left unset is each device's to choose, at every level; one the product sets is
   locked on its devices under synced and enforced. A setting the product sets that is not offered here is shown as it
   is, and may be unset. A refusal in graphql's words. */
export const ProductPolicySettings: React.FC<Props> = ({ productId, settings, manage, onChanged }) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState<string>()
  const [refusal, setRefusal] = useState<string>()
  const rows = offered(t)
  const others = settings.filter(s => !APART.includes(s.name) && !rows.some(row => row.name === s.name))

  const set = async (name: string, value: any) => {
    setSaving(name)
    setRefusal(undefined)
    const result = await graphQLSetDeviceProductSetting(productId, name, value)
    setSaving(undefined)
    if (result !== true)
      setRefusal(
        result !== 'ERROR' && result.reason
          ? result.reason
          : t('productSettings.notChanged', 'The setting was not changed.')
      )
    onChanged()
  }

  return (
    <Box marginTop={2} data-product-settings>
      <Typography variant="subtitle1">{t('productSettings.title', 'Device Settings')}</Typography>
      <Gutters top={null} bottom="xs">
        <Typography variant="caption" component="p">
          {t(
            'productSettings.hint',
            'A setting left unset is each device’s own. One set here is locked on its devices while the product is synced or enforced.'
          )}
        </Typography>
      </Gutters>
      <List disablePadding>
        {rows.map(row => {
          const current = settings.find(s => s.name === row.name)
          const value = current ? row.choices.find(choice => choice.value === current.value)?.key ?? UNSET : UNSET
          return (
            <SelectSetting
              key={row.name}
              data-product-setting={row.name}
              icon={row.icon}
              label={row.label}
              value={value}
              values={[{ key: UNSET, name: t('productSettings.unset', 'Each device’s own') }, ...row.choices]}
              disabled={!manage || saving === row.name}
              onChange={key =>
                key !== value && set(row.name, key === UNSET ? null : row.choices.find(c => c.key === key)?.value)
              }
            />
          )
        })}
        {others.map(setting => (
          <ListItemSetting
            key={setting.name}
            label={setting.name}
            subLabel={JSON.stringify(setting.value)}
            button={manage ? t('productSettings.unsetButton', 'Unset') : undefined}
            buttonDisabled={saving === setting.name}
            icon="sliders-h"
            onButtonClick={() => set(setting.name, null)}
          />
        ))}
      </List>
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
            {refusal}
          </Notice>
        </Gutters>
      )}
    </Box>
  )
}

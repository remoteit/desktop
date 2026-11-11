import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import {
  MAX_DEVICES_CEILING,
  ProductMaxDevices as MaxDevices,
  devicesOver,
  graphQLProductMaxDevices,
  parseMaxDevices,
  setProductMaxDevices,
} from '../services/productMaxDevices'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectPermissions } from '../selectors/organizations'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Notice } from './Notice'

type SettingProps = {
  value: MaxDevices
  manage: boolean
  // The change: the product as it is then, or graphql's refusal in its words ('' where it said none).
  onChange: (maxDevices: number | null) => Promise<{ product?: MaxDevices; reason?: string }>
}

/* How many devices a product may hold (graphql-api docs/PROXY-GROUPS.md §11, "A product's maximum of devices"): none by
   default, edited in place, emptied (or deleted) for none. Beside it, how many devices count against it — every one but a
   disabled one — and, where the maximum was lowered below them, how many are over: none is removed, and none joins until
   removals or disables bring the count under. graphql decides who may set it; the field is offered to the account's admins. */
export const ProductMaxDevicesSetting: React.FC<SettingProps> = ({ value, manage, onChange }) => {
  const { t } = useTranslation()
  const [current, setCurrent] = useState<MaxDevices>(value)
  const [refusal, setRefusal] = useState<string>()
  useEffect(() => setCurrent(value), [value.maxDevices, value.devicesCounted])

  const change = async (maxDevices: number | null) => {
    setRefusal(undefined)
    const { product, reason } = await onChange(maxDevices)
    if (product) setCurrent(product)
    else setRefusal(reason)
  }

  const over = devicesOver(current)
  const counted = current.devicesCounted

  return (
    <Box marginTop={3} data-max-devices={current.maxDevices ?? 'none'}>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productMaxDevices.title', 'Device Limit')}
      </Typography>
      <List disablePadding>
        <InlineTextFieldSetting
          icon="hashtag"
          label={t('productMaxDevices.label', 'Maximum devices')}
          value={current.maxDevices == null ? '' : current.maxDevices.toString()}
          displayValue={
            current.maxDevices == null ? t('productMaxDevices.none', 'No maximum') : current.maxDevices.toString()
          }
          placeholder={t('productMaxDevices.placeholder', 'No maximum')}
          disabled={!manage}
          disableGutters
          maxLength={7}
          validate={typed =>
            parseMaxDevices(typed) === undefined
              ? t('productMaxDevices.problem', 'A whole number from 0 to {{ceiling}}, or empty for no maximum', {
                  ceiling: MAX_DEVICES_CEILING.toLocaleString(),
                })
              : undefined
          }
          helper={typed => {
            const wanted = parseMaxDevices(typed)
            if (wanted === 0)
              return t('productMaxDevices.zero', 'No device can register or be added to this product while it is 0.')
            if (wanted != null && counted != null && wanted < counted)
              return t(
                'productMaxDevices.below',
                'It has {{counted}}: none is removed, but no device joins or comes back on until {{over}} are removed or disabled.',
                { counted, over: counted - wanted }
              )
            return undefined
          }}
          onSave={typed => {
            const wanted = parseMaxDevices(typed.toString())
            if (wanted !== undefined && wanted !== current.maxDevices) return change(wanted)
          }}
          onDelete={current.maxDevices == null ? undefined : () => change(null)}
        />
      </List>
      {counted != null && (
        <Typography variant="caption" color="textSecondary" component="p">
          {t(
            'productMaxDevices.aboutLive',
            '{{counted}} device(s) count against it; disabled ones do not, and removing or disabling one frees its place. At the maximum, a device that registers is refused and tries again later, and a disabled one stays disabled. You are emailed the first time it refuses one, then once a day at most while it keeps refusing.',
            { counted }
          )}
        </Typography>
      )}
      {over > 0 && (
        <Notice severity="warning" fullWidth>
          {t(
            'productMaxDevices.overLive',
            '{{over}} over: no device joins or comes back on until {{over}} are removed or disabled.',
            {
              over,
            }
          )}
        </Notice>
      )}
      {refusal !== undefined && (
        <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
          {refusal || t('productMaxDevices.notChanged', 'The maximum was not changed.')}
        </Notice>
      )}
    </Box>
  )
}

// A product of the account's, where the API has a maximum: read on its own (productMaxDevices), set by its managers.
export const ProductMaxDevices: React.FC<{ product: IDeviceProduct }> = ({ product }) => {
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const accountId = useSelector(selectActiveAccountId)
  const [value, setValue] = useState<MaxDevices>()

  useEffect(() => {
    let current = true
    setValue(undefined)
    graphQLProductMaxDevices(product.id, accountId).then(result => {
      if (current && result && result !== 'ERROR') setValue(result)
    })
    return () => {
      current = false
    }
  }, [product.id, accountId])

  if (!value) return null
  return (
    <ProductMaxDevicesSetting
      value={value}
      manage={admin}
      onChange={maxDevices => setProductMaxDevices(product.id, maxDevices)}
    />
  )
}

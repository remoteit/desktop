import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State, dispatch } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { useDeviceProduct } from '../hooks/useProductPolicy'
import { refreshDeviceSettings } from '../hooks/useDeviceSettings'
import { syncLabel } from '../helpers/productPolicyHelper'
import { ListItemSetting } from './ListItemSetting'
import { ProductMoveDialog } from './ProductMoveDialog'

/* A device's product (graphql-api docs/PROXY-GROUPS.md §11, wave 4): the product it belongs to now and its level, and
   the one it registered with where that is another. Whoever manages the device attaches, changes or detaches it —
   previewed first (ProductMoveDialog) —, after which what the product gave it is read again: its product, its tags and
   services, its settings. Control Link devices only: graphql refuses a legacy device, in its words. Nothing where the API
   has no product policy. */
export const DeviceProductSetting: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const accountId = useSelector((state: State) => selectActiveAccountId(state, device.accountId))
  const { served, state, reload } = useDeviceProduct(device)
  const [open, setOpen] = useState(false)
  const manage = device.permissions.includes('MANAGE')

  if (!served?.device || !state) return null

  const { product, origin } = state
  const elsewhere = origin && (!product || origin.id !== product.id)
  const registered = elsewhere
    ? t('deviceProduct.registeredWith', { name: origin.name || origin.id, defaultValue: 'Registered with {{name}}' })
    : undefined

  const done = async () => {
    await reload()
    refreshDeviceSettings(device.id)
    dispatch.devices.fetchSingleFull({ id: device.id, accountId: device.accountId, silent: true })
  }

  return (
    <>
      <ListItemSetting
        icon="box"
        label={
          product
            ? t('deviceProduct.product', {
                name: product.name,
                level: syncLabel(t, product.sync),
                defaultValue: 'Product: {{name}} · {{level}}',
              })
            : t('deviceProduct.none', 'No product')
        }
        subLabel={registered}
        button={
          manage ? (product ? t('deviceProduct.change', 'Change') : t('deviceProduct.attach', 'Attach')) : undefined
        }
        onButtonClick={() => setOpen(true)}
      />
      <ProductMoveDialog
        open={open}
        accountId={accountId}
        deviceIds={[device.id]}
        current={product}
        onClose={() => setOpen(false)}
        onDone={done}
      />
    </>
  )
}

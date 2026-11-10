import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MenuItem, TextField, Typography } from '@mui/material'
import {
  ProductChoice,
  graphQLDeviceProductPreview,
  graphQLProductChoices,
  graphQLSetDeviceProduct,
  graphQLSetDevicesProduct,
  removes,
} from '../services/productPolicy'
import { syncLabel, syncMeaning } from '../helpers/productPolicyHelper'
import { ProductPolicyPreview, PreviewState } from './ProductPolicyPreview'
import { Confirm } from './Confirm'
import { Notice } from './Notice'

type Props = {
  open: boolean
  accountId: string
  deviceIds: string[]
  current?: { id: string; name: string } | null // one device's product now
  onClose: () => void
  onDone: () => void // what changed, read again
}

// Detaching: the choice of no product.
const NONE = '-'

// Devices previewed one by one at most; more are moved with what graphql says of them.
const PREVIEWED = 50

/* A device's product attached, changed or detached — or several devices' at once (graphql-api docs/PROXY-GROUPS.md §11,
   "Changing a device's product"): a detach from the product it has, everything it holds kept as its own, then an attach
   to the one chosen, whose items apply at its level — template copies them in, synced adds and locks them, enforced
   makes the device exactly the product, removing its extras. What is given, locked, removed and made its own is
   previewed before it is confirmed, with the lifecycle warning where the move makes a device ephemeral; graphql is told
   it was confirmed where something is removed. A refusal — a daemon that cannot change lifecycle, an enforced product
   whose managers alone may detach — in graphql's words. */
export const ProductMoveDialog: React.FC<Props> = ({ open, accountId, deviceIds, current, onClose, onDone }) => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<ProductChoice[]>()
  const [target, setTarget] = useState('')
  const [preview, setPreview] = useState<PreviewState>()
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const single = deviceIds.length === 1
  const previewed = deviceIds.length <= PREVIEWED

  useEffect(() => {
    if (!open) return
    setTarget('')
    setPreview(undefined)
    setRefusal(undefined)
    graphQLProductChoices(accountId).then(answer => setProducts(answer === 'ERROR' ? [] : answer))
  }, [open, accountId])

  const choose = async (choice: string) => {
    setTarget(choice)
    setPreview(undefined)
    setRefusal(undefined)
    if (!previewed) return
    const productId = choice === NONE ? null : choice
    const answers = await Promise.all(deviceIds.map(id => graphQLDeviceProductPreview(id, productId)))
    const refused = answers.find(answer => answer === 'ERROR' || 'reason' in answer)
    if (refused) setPreview(refused === 'ERROR' ? { reason: '' } : (refused as { reason: string }))
    else setPreview(answers as any)
  }

  const chosen = products?.find(product => product.id === target)
  const losing = Array.isArray(preview) && removes(preview)
  // Without a preview, a move into an enforced product is confirmed as one that removes.
  const confirmed = previewed ? losing : chosen?.sync === 'enforced'

  const confirm = async () => {
    if (!target) return
    setSaving(true)
    setRefusal(undefined)
    const productId = target === NONE ? null : target
    const result = single
      ? await graphQLSetDeviceProduct(deviceIds[0], productId, confirmed)
      : await graphQLSetDevicesProduct(deviceIds, productId, confirmed)
    setSaving(false)
    if (result === true) {
      onDone()
      return onClose()
    }
    setRefusal(
      result !== 'ERROR' && result.reason ? result.reason : t('productMove.notChanged', 'The product was not changed.')
    )
  }

  const choices = (products || []).filter(product => product.id !== current?.id)
  const action =
    target === NONE
      ? t('productMove.detach', 'Detach')
      : losing || confirmed
      ? t('productMove.moveRemove', 'Move and Remove')
      : current
      ? t('productMove.move', 'Move')
      : t('productMove.attach', 'Attach')

  return (
    <Confirm
      open={open}
      maxWidth="sm"
      title={
        single
          ? current
            ? t('productMove.changeTitle', { name: current.name, defaultValue: 'Change its product from {{name}}' })
            : t('productMove.attachTitle', 'Attach it to a product')
          : t('productMove.manyTitle', {
              count: deviceIds.length,
              defaultValue_one: 'Move {{count}} device to a product',
              defaultValue_other: 'Move {{count}} devices to a product',
            })
      }
      action={action}
      color={losing || confirmed ? 'warning' : 'primary'}
      disabled={saving || !target || (previewed && !Array.isArray(preview))}
      onConfirm={confirm}
      onDeny={onClose}
    >
      <TextField
        select
        fullWidth
        variant="filled"
        label={t('productMove.product', 'Product')}
        value={target}
        disabled={!products || saving}
        onChange={e => choose(e.target.value)}
        inputProps={{ 'data-product-choice': true }}
        sx={{ marginBottom: 2 }}
      >
        {choices.map(product => (
          <MenuItem key={product.id} value={product.id}>
            {product.name} · {syncLabel(t, product.sync)}
          </MenuItem>
        ))}
        {(current || !single) && (
          <MenuItem value={NONE}>
            {single
              ? t('productMove.none', 'No product: detach it')
              : t('productMove.noneMany', 'No product: detach them')}
          </MenuItem>
        )}
      </TextField>
      {chosen && (
        <Typography variant="body2" gutterBottom>
          {syncMeaning(t, chosen.sync)}
        </Typography>
      )}
      {target === NONE && (
        <Typography variant="body2" gutterBottom>
          {t(
            'productMove.detachMeaning',
            'Everything it has from its product is kept as its own, memberships included, free to change.'
          )}
        </Typography>
      )}
      {target &&
        (previewed ? (
          <ProductPolicyPreview preview={preview} single={single} />
        ) : (
          chosen?.sync === 'enforced' && (
            <Notice severity="warning" fullWidth>
              {t(
                'productMove.enforcedMany',
                'Each device becomes exactly the product: what it has of its own that the product does not is removed.'
              )}
            </Notice>
          )
        ))}
      {refusal && (
        <Notice severity="error" fullWidth gutterTop onClose={() => setRefusal(undefined)}>
          {refusal}
        </Notice>
      )}
    </Confirm>
  )
}

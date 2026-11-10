import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, Typography } from '@mui/material'
import {
  PRODUCT_SYNCS,
  ProductSync,
  graphQLProductSyncPreview,
  graphQLSetDeviceProductSync,
  removes,
} from '../services/productPolicy'
import { syncLabel, syncMeaning } from '../helpers/productPolicyHelper'
import { ProductPolicyPreview, PreviewState } from './ProductPolicyPreview'
import { SelectSetting } from './SelectSetting'
import { Confirm } from './Confirm'
import { Notice } from './Notice'

type Props = {
  productId: string
  name: string // the product's, for the question
  sync: ProductSync
  manage: boolean
  onChanged: () => void // read the product again
}

/* A product's sync level (graphql-api docs/PROXY-GROUPS.md §11, "Sync levels"): template, its items copied to a device
   as it registers; synced, locked on its devices and following the product, each free to add its own; enforced, each
   exactly the product. A change is previewed first — what its devices get, what becomes locked, what they lose (only
   raising to enforced removes anything) and what becomes their own (moving down to template) — and confirmed; graphql
   is told it was confirmed only where something is removed. A refusal in graphql's words. */
export const ProductSyncLevel: React.FC<Props> = ({ productId, name, sync, manage, onChanged }) => {
  const { t } = useTranslation()
  const [target, setTarget] = useState<ProductSync>()
  const [preview, setPreview] = useState<PreviewState>()
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()

  const choose = async (next: ProductSync) => {
    if (next === sync) return
    setTarget(next)
    setPreview(undefined)
    setRefusal(undefined)
    const answer = await graphQLProductSyncPreview(productId, next)
    setPreview(answer === 'ERROR' ? { reason: '' } : answer)
  }

  const close = () => {
    setTarget(undefined)
    setPreview(undefined)
  }

  const confirm = async () => {
    if (!target || !Array.isArray(preview)) return
    setSaving(true)
    const result = await graphQLSetDeviceProductSync(productId, target, removes(preview))
    setSaving(false)
    close()
    if (result === true) return onChanged()
    setRefusal(
      result !== 'ERROR' && result.reason
        ? result.reason
        : t('productSync.notChanged', 'The sync level was not changed.')
    )
  }

  const losing = Array.isArray(preview) && removes(preview)

  return (
    <Box data-sync={sync}>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productSync.title', 'Sync Level')}
      </Typography>
      <List disablePadding>
        <SelectSetting
          icon="arrows-rotate"
          label={t('productSync.label', 'Its devices get its items')}
          value={sync}
          values={PRODUCT_SYNCS.map(level => ({
            key: level,
            name: syncLabel(t, level),
            description: syncMeaning(t, level),
          }))}
          disabled={!manage || saving}
          disableGutters
          helperText={syncMeaning(t, sync)}
          onChange={next => choose(next as ProductSync)}
        />
      </List>
      {refusal && (
        <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
          {refusal}
        </Notice>
      )}
      <Confirm
        open={!!target}
        title={
          target &&
          t('productSync.confirmTitle', {
            name,
            level: syncLabel(t, target),
            defaultValue: 'Make {{name}} {{level}}?',
          })
        }
        action={
          target &&
          (losing
            ? t('productSync.confirmRemove', { level: syncLabel(t, target), defaultValue: '{{level}} and Remove' })
            : t('productSync.confirm', { level: syncLabel(t, target), defaultValue: 'Make {{level}}' }))
        }
        color={losing ? 'warning' : 'primary'}
        disabled={saving || !Array.isArray(preview)}
        maxWidth="sm"
        onConfirm={confirm}
        onDeny={close}
      >
        {target && (
          <Typography variant="body2" gutterBottom>
            {syncMeaning(t, target)}
          </Typography>
        )}
        <ProductPolicyPreview preview={preview} />
      </Confirm>
    </Box>
  )
}

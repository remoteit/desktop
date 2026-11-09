import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { ProductLifecycle as Lifecycle } from '../services/graphQLDeviceProducts'
import { selectPermissions } from '../selectors/organizations'
import { ListItemSetting } from './ListItemSetting'
import { Notice } from './Notice'
import { dispatch } from '../store'

type SettingProps = {
  name: string // the product's, for the question
  lifecycle: Lifecycle
  manage: boolean
  // The change: graphql's refusal in its words ('' where it said none), or none where it went through.
  onChange: (lifecycle: Lifecycle) => Promise<{ reason?: string }>
}

/* A product's lifecycle (graphql-api docs/PROXY-GROUPS.md §11, "Persistent or ephemeral"), said plainly before it is
   changed: persistent, as every product has been, each device keeping its identity on disk; or ephemeral, each keeping
   it in memory — a daemon's restart keeps it, a reboot or a new machine is a new device, which registers again with a
   join key —, a device removed when it deregisters or after 10 minutes offline. Moving to ephemeral warns that the
   devices there now go at their next reboot unless their machines can register again. graphql refuses the change while
   a device of the product runs a daemon that cannot keep its identity so, saying how many: said in its words. The
   product's page changes it through the store (ProductLifecycle), remote.it's admin page through its own read. */
export const ProductLifecycleSetting: React.FC<SettingProps> = ({ name, lifecycle, manage, onChange }) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const ephemeral = lifecycle === 'ephemeral'
  const meaning = t(
    'productLifecycle.ephemeralMeaning',
    'Ephemeral devices keep their identity in memory: a daemon restart keeps it, but after a reboot or on a new machine each is a new device, which registers again with a join key. A device is removed when it deregisters, or after 10 minutes offline.'
  )

  const change = async () => {
    setSaving(true)
    setRefusal(undefined)
    const { reason } = await onChange(ephemeral ? 'persistent' : 'ephemeral')
    setRefusal(reason)
    setSaving(false)
  }

  return (
    <Box marginTop={3} data-lifecycle={lifecycle}>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productLifecycle.title', 'Device Lifecycle')}
      </Typography>
      <List disablePadding>
        <ListItemSetting
          icon="recycle"
          label={t('productLifecycle.label', 'Ephemeral devices')}
          subLabel={
            ephemeral
              ? meaning
              : t(
                  'productLifecycle.persistentMeaning',
                  'Off: each device keeps its identity on disk, through restarts and reboots, until it is removed.'
                )
          }
          toggle={ephemeral}
          disabled={!manage || saving}
          disableGutters
          confirm
          confirmProps={{
            title: ephemeral
              ? t('productLifecycle.toPersistentTitle', { name, defaultValue: 'Make {{name}}’s devices persistent?' })
              : t('productLifecycle.toEphemeralTitle', { name, defaultValue: 'Make {{name}}’s devices ephemeral?' }),
            action: ephemeral
              ? t('productLifecycle.toPersistent', 'Make Persistent')
              : t('productLifecycle.toEphemeral', 'Make Ephemeral'),
            color: ephemeral ? 'primary' : 'warning',
            children: ephemeral ? (
              <Typography variant="body2">
                {t(
                  'productLifecycle.toPersistentBody',
                  'Its devices keep their identity on disk from now on, through reboots, and are no longer removed after 10 minutes offline.'
                )}
              </Typography>
            ) : (
              <>
                <Typography variant="body2" gutterBottom>
                  {meaning}
                </Typography>
                <Notice severity="warning" fullWidth>
                  {t(
                    'productLifecycle.toEphemeralWarning',
                    'Its devices are removed at their next reboot, or after 10 minutes offline, unless the machine can register itself again with a join key.'
                  )}
                </Notice>
              </>
            ),
          }}
          onClick={change}
        />
      </List>
      {refusal !== undefined && (
        <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
          {refusal || t('productLifecycle.notChanged', 'The lifecycle was not changed.')}
        </Notice>
      )}
    </Box>
  )
}

// A product of the account's: its managers change it, the store reads it again.
export const ProductLifecycle: React.FC<{ product: IDeviceProduct }> = ({ product }) => {
  const admin = useSelector(selectPermissions).includes('ADMIN')
  if (!product.lifecycle) return null
  return (
    <ProductLifecycleSetting
      name={product.name}
      lifecycle={product.lifecycle}
      manage={admin}
      onChange={lifecycle => dispatch.products.setLifecycle({ productId: product.id, lifecycle })}
    />
  )
}

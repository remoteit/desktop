import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { IDeviceProduct, IDeviceProductJoinKey } from '../models/products'
import { JOIN_KEY_ENV, JOIN_KEY_FILE_ENV } from '../constants'
import { selectPermissions } from '../selectors/organizations'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { DynamicButton } from '../buttons/DynamicButton'
import { CreateJoinKeyDialog } from './CreateJoinKeyDialog'
import { ColorChip } from './ColorChip'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

// Why a key creates no device now, when it does not: graphql's inForce, told apart by graphql's own fields rather than
// this machine's clock — revoked, at its maximum of joins, or else past its expiry.
function keyState(key: IDeviceProductJoinKey): 'revoked' | 'expired' | 'full' | undefined {
  if (key.inForce) return undefined
  if (key.revoked) return 'revoked'
  if (key.maxJoins != null && key.joins >= key.maxJoins) return 'full'
  return 'expired'
}

// The product's join keys, newest first: each creates new devices of the product, for a machine that holds it. The key
// itself is shown once, by the dialog that creates it; the list carries only what graphql keeps.
export const ProductJoinKeys: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState<string>()
  const keys = product.joinKeys || []

  const revoke = async (id: string) => {
    setRevoking(id)
    await dispatch.products.revokeJoinKey({ productId: product.id, id })
    setRevoking(undefined)
  }

  const states = {
    revoked: t('productJoinKeys.revoked', 'Revoked'),
    expired: t('productJoinKeys.expired', 'Expired'),
    full: t('productJoinKeys.full', 'All joins used'),
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="textSecondary">
          {t('productJoinKeys.title', 'Join Keys')}
        </Typography>
        <DynamicButton
          size="small"
          icon="plus"
          title={t('productJoinKeys.create', 'Create Join Key')}
          disabled={!admin || !!revoking}
          onClick={() => setCreating(true)}
        />
      </Stack>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {t('productJoinKeys.description', {
          env: JOIN_KEY_ENV,
          file: JOIN_KEY_FILE_ENV,
          defaultValue:
            'For automation: give a key to the machine as {{env}}, or in a file named by {{file}}. A key creates new devices of this product and nothing else, and is shown only when it is created.',
        })}
      </Typography>
      {keys.length ? (
        <List dense disablePadding>
          {keys.map(key => {
            const state = keyState(key)
            return (
              <ListItem
                key={key.id}
                disableGutters
                // Room for the action: the theme's list padding leaves none, and a key's lines are long.
                sx={{ paddingRight: 6 }}
                secondaryAction={
                  key.inForce && (
                    <ConfirmIconButton
                      confirm
                      confirmProps={{
                        color: 'error',
                        action: t('productJoinKeys.revokeAction', 'Revoke Key'),
                        title: t('productJoinKeys.revokeTitle', {
                          name: key.name,
                          defaultValue: 'Revoke join key "{{name}}"?',
                        }),
                        children: (
                          <Notice severity="error" gutterBottom fullWidth>
                            {t(
                              'productJoinKeys.revokeBody',
                              'No device can join with this key from now on. The devices it created are not affected: remove them separately if the key leaked. This cannot be undone.'
                            )}
                          </Notice>
                        ),
                      }}
                      name="ban"
                      title={t('productJoinKeys.revoke', 'Revoke Key')}
                      loading={revoking === key.id}
                      disabled={!admin || !!revoking}
                      onClick={() => revoke(key.id)}
                    />
                  )
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: key.revoked ? 'line-through' : undefined }}
                        color={state ? 'textSecondary' : undefined}
                      >
                        {key.name}
                      </Typography>
                      {state && <ColorChip label={states[state]} size="small" color="grayDark" />}
                      {key.unused && (
                        <ColorChip label={t('productJoinKeys.unused', 'Unused')} size="small" color="warning" />
                      )}
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <div>
                        {t('productJoinKeys.created', 'Created')}{' '}
                        <Timestamp date={new Date(key.created)} variant="minutes" />
                        {key.creator?.email && (
                          <> {t('productJoinKeys.by', { email: key.creator.email, defaultValue: 'by {{email}}' })}</>
                        )}
                        {key.revoked && (
                          <>
                            {' · '}
                            {t('productJoinKeys.revoked', 'Revoked')}{' '}
                            <Timestamp date={new Date(key.revoked)} variant="minutes" />
                          </>
                        )}
                      </div>
                      <div>
                        {key.lastUsed ? (
                          <>
                            {t('productJoinKeys.lastUsed', 'Last used')}{' '}
                            <Timestamp date={new Date(key.lastUsed)} variant="minutes" />
                          </>
                        ) : (
                          t('productJoinKeys.neverUsed', 'Never used')
                        )}
                        {' · '}
                        {key.maxJoins != null
                          ? t('productJoinKeys.joinsOfMax', {
                              joins: key.joins,
                              max: key.maxJoins,
                              defaultValue: 'Devices joined: {{joins}} of {{max}}',
                            })
                          : t('productJoinKeys.joins', { joins: key.joins, defaultValue: 'Devices joined: {{joins}}' })}
                        {' · '}
                        {key.expires ? (
                          <>
                            {t('productJoinKeys.expires', 'Expires')}{' '}
                            <Timestamp date={new Date(key.expires)} variant="minutes" />
                          </>
                        ) : (
                          t('productJoinKeys.noExpiry', 'No expiry')
                        )}
                      </div>
                      {key.suggestion && (
                        <Typography variant="caption" color="warning.main" component="div">
                          {key.suggestion}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t('productJoinKeys.none', 'No join keys yet.')}
        </Typography>
      )}
      {creating && <CreateJoinKeyDialog product={product} onClose={() => setCreating(false)} />}
    </Box>
  )
}

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { selectPermissions } from '../selectors/organizations'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { DynamicButton } from '../buttons/DynamicButton'
import { ColorChip } from './ColorChip'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

// Every reusable registration code the product has issued, newest first, each with its last use, so it is clear when
// one can go. The newest code in force is the one in the registration command; the others in force still register
// devices until revoked. The last code in force can be revoked only while a join key is in force (graphql refuses it
// otherwise, so the product keeps a way to register devices): without one its revoke button is disabled.
export const ProductRegistrationCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [rotating, setRotating] = useState(false)
  const [revoking, setRevoking] = useState<string>()

  // One change at a time: each reads the product again, and two reads in flight could land out of order.
  const busy = rotating || !!revoking
  const codes = product.registrationCodes || []
  const inForce = codes.filter(code => !code.revoked)
  const current = inForce[0]?.code
  const keyInForce = !!product.joinKeys?.some(key => key.inForce)
  const last = inForce.length <= 1
  const locked = last && !keyInForce

  const rotate = async () => {
    setRotating(true)
    await dispatch.products.rotateCode(product.id)
    setRotating(false)
  }

  const revoke = async (code: string) => {
    setRevoking(code)
    await dispatch.products.revokeCode({ productId: product.id, code })
    setRevoking(undefined)
  }

  return (
    <Box sx={{ marginTop: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="textSecondary">
          {t('productRegistrationCodes.reusableTitle', 'Reusable Codes')}
        </Typography>
        <DynamicButton
          size="small"
          icon="rotate"
          title={t('productRegistrationCodes.rotate', 'Rotate Code')}
          loading={rotating}
          disabled={!admin || busy}
          onClick={rotate}
        />
      </Stack>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {t(
          'productRegistrationCodes.description',
          'Rotating issues a new code for the registration command. Earlier codes keep registering devices until you revoke them; devices already registered are not affected.'
        )}
      </Typography>
      <List dense disablePadding>
        {codes.map(code => (
          <ListItem
            key={code.code}
            disableGutters
            // Room for the action: the theme's list padding leaves none.
            sx={{ paddingRight: 6 }}
            secondaryAction={
              !code.revoked && (
                <ConfirmIconButton
                  confirm
                  confirmProps={{
                    color: 'error',
                    action: t('productRegistrationCodes.revokeAction', 'Revoke Code'),
                    title: t('productRegistrationCodes.revokeTitle', 'Revoke registration code?'),
                    children: (
                      <Notice severity="error" gutterBottom fullWidth>
                        {t(
                          'productRegistrationCodes.revokeBody',
                          'No device can register with this code from now on, and devices can no longer register with a service ID of this product. Devices already registered are not affected. This cannot be undone.'
                        )}
                        {last && (
                          <em>
                            {t(
                              'productRegistrationCodes.revokeLastBody',
                              "It is the product's last reusable code: the registration command stops working, and devices register with its join keys and one-time codes."
                            )}
                          </em>
                        )}
                      </Notice>
                    ),
                  }}
                  name="ban"
                  forceTitle
                  title={
                    locked
                      ? t(
                          'productRegistrationCodes.revokeLastCredential',
                          'Rotate the code or create a join key first: this is the only code in force'
                        )
                      : t('productRegistrationCodes.revoke', 'Revoke Code')
                  }
                  loading={revoking === code.code}
                  disabled={!admin || locked || busy}
                  onClick={() => revoke(code.code)}
                />
              )
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Roboto Mono', monospace",
                      textDecoration: code.revoked ? 'line-through' : undefined,
                    }}
                    color={code.revoked ? 'textSecondary' : undefined}
                  >
                    {code.code}
                  </Typography>
                  {code.code === current && (
                    <ColorChip
                      label={t('productRegistrationCodes.current', 'Current')}
                      size="small"
                      color="primary"
                      variant="contained"
                    />
                  )}
                </Stack>
              }
              secondary={
                <>
                  {t('productRegistrationCodes.issued', 'Issued')} <Timestamp date={new Date(code.created)} />
                  {' · '}
                  {code.lastUsed ? (
                    <>
                      {t('productRegistrationCodes.lastUsed', 'Last used')}{' '}
                      <Timestamp date={new Date(code.lastUsed)} variant="minutes" />
                    </>
                  ) : (
                    t('productRegistrationCodes.noUse', 'No use recorded')
                  )}
                  {code.revoked && (
                    <>
                      {' · '}
                      {t('productRegistrationCodes.revoked', 'Revoked')} <Timestamp date={new Date(code.revoked)} />
                    </>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

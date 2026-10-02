import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { DynamicButton } from '../buttons/DynamicButton'
import { ColorChip } from './ColorChip'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

// Every registration code the product has issued, newest first. The newest code in force is the one in the registration
// command; the others in force still register devices until revoked. The last code in force cannot be revoked (graphql
// refuses it), so its revoke button is disabled: rotate first.
export const ProductRegistrationCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const [rotating, setRotating] = useState(false)
  const [revoking, setRevoking] = useState<string>()

  const codes = product.registrationCodes || []
  const inForce = codes.filter(code => !code.revoked)
  const current = inForce[0]?.code

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
          {t('productRegistrationCodes.title', 'Registration Codes')}
        </Typography>
        <DynamicButton
          size="small"
          icon="rotate"
          title={t('productRegistrationCodes.rotate', 'Rotate Code')}
          loading={rotating}
          disabled={rotating}
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
                      </Notice>
                    ),
                  }}
                  name="ban"
                  title={
                    inForce.length > 1
                      ? t('productRegistrationCodes.revoke', 'Revoke Code')
                      : t('productRegistrationCodes.revokeLast', 'Rotate first: this is the only code in force')
                  }
                  loading={revoking === code.code}
                  disabled={inForce.length <= 1 || !!revoking}
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
                    sx={{ fontFamily: "'Roboto Mono', monospace", textDecoration: code.revoked ? 'line-through' : undefined }}
                    color={code.revoked ? 'textSecondary' : undefined}
                  >
                    {code.code}
                  </Typography>
                  {code.code === current && (
                    <ColorChip label={t('productRegistrationCodes.current', 'Current')} size="small" color="primary" variant="contained" />
                  )}
                </Stack>
              }
              secondary={
                <>
                  {t('productRegistrationCodes.issued', 'Issued')} <Timestamp date={new Date(code.created)} />
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

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { IDeviceProduct, IDeviceProductCode } from '../models/products'
import { REGISTRATION_CODE_EXPIRATION_HOURS } from '../constants'
import { selectPermissions } from '../selectors/organizations'
import { platforms } from '../platforms'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { DynamicButton } from '../buttons/DynamicButton'
import { CopyCodeBlock } from './CopyCodeBlock'
import { ColorChip } from './ColorChip'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

// Whether a one-time code still registers a device, and if not, why: graphql keeps used and expired ones a day past
// their expiry, and revoked ones.
function codeState(code: IDeviceProductCode, now = new Date()): 'used' | 'revoked' | 'expired' | undefined {
  if ((code.used ?? 0) >= 1) return 'used'
  if (code.revoked) return 'revoked'
  if (code.expires && new Date(code.expires) <= now) return 'expired'
  return undefined
}

const mono = { fontFamily: "'Roboto Mono', monospace" }

// A code just made: with the install command where the client can render it for the product's platform, else the
// code alone and where it goes. Graphql renders no command for a one-time code.
const OneTimeCodeDialog: React.FC<{ product: IDeviceProduct; code: IDeviceProductCode; onClose: () => void }> = ({
  product,
  code,
  onClose,
}) => {
  const { t } = useTranslation()
  const command = platforms.codeCommand(product.platform?.id, code.code)

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('productOneTimeCodes.dialogTitle', 'Add One Device')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          {command && command !== code.code
            ? t(
                'productOneTimeCodes.runCommand',
                'Run this command on the device. The code in it registers one device.'
              )
            : t('productOneTimeCodes.giveCode', {
                env: 'R3_REGISTRATION_CODE',
                defaultValue:
                  "Give this code to the device's installer as its registration code ({{env}}). It registers one device.",
              })}
        </Typography>
        <CopyCodeBlock
          value={command || code.code}
          code={code.code}
          label={t('productOneTimeCodes.codeLabel', 'One-time Code')}
          sx={{ marginBottom: 2 }}
        />
        {code.expires && (
          <Typography variant="body2" color="textSecondary">
            {t('productOneTimeCodes.expires', 'Expires')} <Timestamp date={new Date(code.expires)} variant="minutes" />
            {' · '}
            {t('productOneTimeCodes.validFor', {
              hours: REGISTRATION_CODE_EXPIRATION_HOURS,
              defaultValue: '{{hours}} hours after it was made',
            })}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('common.done', 'Done')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// "Add one device": one-time codes, each registering a single device within 24 hours, for any product. Unlike a join
// key a one-time code stays readable, so a live one can be copied again from the list.
export const ProductOneTimeCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [minting, setMinting] = useState(false)
  const [revoking, setRevoking] = useState<string>()
  const [shown, setShown] = useState<IDeviceProductCode>()
  const codes = product.oneTimeCodes || []
  const busy = minting || !!revoking

  const mint = async () => {
    setMinting(true)
    const code = await dispatch.products.createOneTimeCode(product.id)
    setMinting(false)
    if (code) setShown(code)
  }

  const revoke = async (code: string) => {
    setRevoking(code)
    await dispatch.products.revokeCode({ productId: product.id, code })
    setRevoking(undefined)
  }

  const states = {
    used: t('productOneTimeCodes.used', 'Used'),
    revoked: t('productOneTimeCodes.revoked', 'Revoked'),
    expired: t('productOneTimeCodes.expired', 'Expired'),
  }

  return (
    <Box sx={{ marginTop: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="textSecondary">
          {t('productOneTimeCodes.title', 'One-time Codes')}
        </Typography>
        <DynamicButton
          size="small"
          icon="plus"
          title={t('productOneTimeCodes.add', 'Add One Device')}
          loading={minting}
          disabled={!admin || busy}
          onClick={mint}
        />
      </Stack>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {t('productOneTimeCodes.description', {
          hours: REGISTRATION_CODE_EXPIRATION_HOURS,
          defaultValue: 'For adding one device by hand: each code registers a single device, within {{hours}} hours.',
        })}
      </Typography>
      {codes.length ? (
        <List dense disablePadding>
          {codes.map(code => {
            const state = codeState(code)
            return (
              <ListItem
                key={code.code}
                disableGutters
                // Room for the action: the theme's list padding leaves none.
                sx={{ paddingRight: 6 }}
                secondaryAction={
                  !state && (
                    <ConfirmIconButton
                      confirm
                      confirmProps={{
                        color: 'error',
                        action: t('productOneTimeCodes.revokeAction', 'Revoke Code'),
                        title: t('productOneTimeCodes.revokeTitle', 'Revoke one-time code?'),
                        children: (
                          <Notice severity="error" gutterBottom fullWidth>
                            {t(
                              'productOneTimeCodes.revokeBody',
                              'No device can register with this code from now on. This cannot be undone.'
                            )}
                          </Notice>
                        ),
                      }}
                      name="ban"
                      title={t('productOneTimeCodes.revoke', 'Revoke Code')}
                      loading={revoking === code.code}
                      disabled={!admin || busy}
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
                        sx={{ ...mono, textDecoration: state && state !== 'used' ? 'line-through' : undefined }}
                        color={state ? 'textSecondary' : undefined}
                      >
                        {code.code}
                      </Typography>
                      {state ? (
                        <ColorChip
                          label={states[state]}
                          size="small"
                          color={state === 'used' ? 'success' : 'grayDark'}
                        />
                      ) : (
                        <CopyIconButton
                          value={code.code}
                          size="sm"
                          buttonBaseSize="small"
                          title={t('productOneTimeCodes.copy', 'Copy code')}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <>
                      {t('productOneTimeCodes.issued', 'Issued')}{' '}
                      <Timestamp date={new Date(code.created)} variant="minutes" />
                      {' · '}
                      {state === 'used' ? (
                        code.lastUsed ? (
                          <>
                            {t('productOneTimeCodes.usedAt', 'Used')}{' '}
                            <Timestamp date={new Date(code.lastUsed)} variant="minutes" />
                          </>
                        ) : (
                          states.used
                        )
                      ) : state === 'revoked' && code.revoked ? (
                        <>
                          {states.revoked} <Timestamp date={new Date(code.revoked)} variant="minutes" />
                        </>
                      ) : (
                        code.expires && (
                          <>
                            {state === 'expired' ? states.expired : t('productOneTimeCodes.expires', 'Expires')}{' '}
                            <Timestamp date={new Date(code.expires)} variant="minutes" />
                          </>
                        )
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
          {t('productOneTimeCodes.none', 'No one-time codes yet.')}
        </Typography>
      )}
      {shown && <OneTimeCodeDialog product={product} code={shown} onClose={() => setShown(undefined)} />}
    </Box>
  )
}

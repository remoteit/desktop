import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListItemText, Stack, Tooltip, Typography } from '@mui/material'
import { IDeviceProduct, IDeviceProductCode } from '../models/products'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { ListItemCheckbox } from './ListItemCheckbox'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ColorChip } from './ColorChip'
import { Duration } from './Duration'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

const shortCode = (code: string) => `${code.slice(0, 8)}…${code.slice(-4)}`

// The newest code in force is the one in the registration command. A product keeps at most one more in force, the code it
// replaced, so devices still being set up with it are not cut off; replacing again revokes anything older.
export const ProductRegistrationCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const [replacing, setReplacing] = useState(false)
  const [revoking, setRevoking] = useState<string>()
  const [revokePrevious, setRevokePrevious] = useState(false)

  // One change at a time: each reads the product again, and two reads in flight could land out of order.
  const busy = replacing || !!revoking
  const codes = product.registrationCodes || []
  const [current, ...previous] = codes.filter(code => !code.revoked)
  const revoked = codes.filter(code => code.revoked)

  const replace = async () => {
    setReplacing(true)
    await dispatch.products.rotateCode({ productId: product.id, revokePrevious })
    setReplacing(false)
    setRevokePrevious(false)
  }

  const revoke = async (code: string) => {
    setRevoking(code)
    await dispatch.products.revokeCode({ productId: product.id, code })
    setRevoking(undefined)
  }

  const when = (label: string, date: string) => (
    <Tooltip title={<Timestamp date={new Date(date)} />} placement="bottom-start">
      <span>
        {label} <Duration startDate={new Date(date)} ago humanizeOptions={{ largest: 1 }} />
      </span>
    </Tooltip>
  )

  const codeText = (code: IDeviceProductCode) => (
    <Tooltip title={code.code} placement="top-start">
      <Typography
        variant="body2"
        component="span"
        sx={{ fontFamily: "'Roboto Mono', monospace", textDecoration: code.revoked ? 'line-through' : undefined }}
        color={code.revoked ? 'textSecondary' : undefined}
      >
        {shortCode(code.code)}
      </Typography>
    </Tooltip>
  )

  return (
    <Box sx={{ marginTop: 3 }}>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productRegistrationCodes.title', 'Codes in use')}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {t(
          'productRegistrationCodes.description',
          "Replacing the code updates the command above. Devices already registered aren't affected."
        )}
      </Typography>
      <List dense disablePadding>
        {current && (
          <ListItem disableGutters>
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  {codeText(current)}
                  <ColorChip
                    label={t('productRegistrationCodes.current', 'Current')}
                    size="small"
                    color="primary"
                    variant="contained"
                  />
                </Stack>
              }
              secondary={when(t('productRegistrationCodes.issued', 'Issued'), current.created)}
            />
          </ListItem>
        )}
        {previous.map(code => (
          <ListItem
            key={code.code}
            disableGutters
            secondaryAction={
              <ConfirmButton
                confirm
                confirmProps={{
                  color: 'error',
                  action: t('productRegistrationCodes.revokeAction', 'Revoke Code'),
                  title: t('productRegistrationCodes.revokeTitle', 'Revoke registration code?'),
                  children: (
                    <Notice severity="error" gutterBottom fullWidth>
                      {t(
                        'productRegistrationCodes.revokeBody',
                        "Devices can no longer register with this code. Devices already registered aren't affected. This can't be undone."
                      )}
                    </Notice>
                  ),
                }}
                size="small"
                variant="text"
                color="danger"
                title={t('productRegistrationCodes.revoke', 'Revoke')}
                loading={revoking === code.code}
                disabled={busy}
                onClick={() => revoke(code.code)}
              />
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  {codeText(code)}
                  <ColorChip
                    label={t('productRegistrationCodes.previous', 'Previous')}
                    size="small"
                    color="grayDark"
                    variant="contained"
                  />
                </Stack>
              }
              secondary={
                <>
                  {t('productRegistrationCodes.stillWorks', 'Still registers devices')}
                  {' · '}
                  {when(t('productRegistrationCodes.issued', 'Issued'), code.created)}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <ConfirmButton
        confirm
        confirmProps={{
          color: revokePrevious ? 'error' : 'primary',
          action: revokePrevious
            ? t('productRegistrationCodes.replaceAndRevokeAction', 'Replace and Revoke')
            : t('productRegistrationCodes.replaceAction', 'Replace Code'),
          title: t('productRegistrationCodes.replaceTitle', 'Replace registration code?'),
          children: (
            <>
              <Typography variant="body2" gutterBottom>
                {t('productRegistrationCodes.replaceBody', {
                  code: current && shortCode(current.code),
                  defaultValue:
                    "The new code goes in the registration command. The current code {{code}} keeps registering devices until you revoke it, so devices still being set up with it aren't cut off.",
                })}
              </Typography>
              {previous.length > 0 && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {t('productRegistrationCodes.replaceRevokesPrevious', {
                    code: shortCode(previous[0].code),
                    defaultValue: 'The older code {{code}} will be revoked: only two codes stay in use.',
                  })}
                </Typography>
              )}
              <List disablePadding>
                <ListItemCheckbox
                  checked={revokePrevious}
                  label={t('productRegistrationCodes.revokeNow', {
                    code: current && shortCode(current.code),
                    defaultValue: 'Stop {{code}} now too',
                  })}
                  subLabel={t(
                    'productRegistrationCodes.revokeNowHelp',
                    "If it leaked. Devices still being set up with it won't be able to register."
                  )}
                  onClick={checked => setRevokePrevious(checked)}
                  disableGutters
                />
              </List>
            </>
          ),
        }}
        size="small"
        variant="text"
        color="grayDark"
        icon="rotate"
        title={t('productRegistrationCodes.replace', 'Replace Code')}
        loading={replacing}
        disabled={busy}
        onClick={replace}
        sx={{ marginTop: 1 }}
      />
      {revoked.length > 0 && (
        <Box sx={{ marginTop: 2 }}>
          <AccordionMenuItem
            subtitle={t('productRegistrationCodes.revokedHistory', {
              total: revoked.length,
              defaultValue: 'Revoked codes ({{total}})',
            })}
          >
            <List dense disablePadding>
              {revoked.map(code => (
                <ListItem key={code.code} disableGutters>
                  <ListItemText
                    primary={codeText(code)}
                    secondary={when(t('productRegistrationCodes.revoked', 'Revoked'), code.revoked!)}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionMenuItem>
        </Box>
      )}
    </Box>
  )
}

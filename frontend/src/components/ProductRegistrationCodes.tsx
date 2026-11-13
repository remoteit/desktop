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

const issued = (label: string, created: string) => {
  const date = new Date(created)
  return (
    <Tooltip title={<Timestamp date={date} />} placement="bottom-start">
      <span>
        {label} <Duration startDate={date} ago humanizeOptions={{ largest: 1 }} />
      </span>
    </Tooltip>
  )
}

const codeText = (code: IDeviceProductCode, chip?: { label: string; color: Color }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Tooltip title={code.code} placement="top-start">
      <Typography variant="body2" component="span" sx={{ fontFamily: "'Roboto Mono', monospace" }}>
        {shortCode(code.code)}
      </Typography>
    </Tooltip>
    {chip && <ColorChip label={chip.label} size="small" color={chip.color} variant="contained" />}
  </Stack>
)

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
  const currentCode = current && shortCode(current.code)
  const endsServiceIds = !revoked.length && (
    <Typography variant="body2" color="textSecondary" gutterBottom>
      {t(
        'productRegistrationCodes.endsServiceIds',
        'Revoking a code also stops devices registering with a service ID of this product.'
      )}
    </Typography>
  )

  const replace = async () => {
    setReplacing(true)
    await dispatch.products.rotateCode({ productId: product.id, revokePrevious })
    setReplacing(false)
  }

  const revoke = async (code: string) => {
    setRevoking(code)
    await dispatch.products.revokeCode({ productId: product.id, code })
    setRevoking(undefined)
  }

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
              primary={codeText(current, { label: t('productRegistrationCodes.current', 'Current'), color: 'primary' })}
              secondary={issued(t('productRegistrationCodes.issued', 'Issued'), current.created)}
            />
          </ListItem>
        )}
        {previous.map(code => (
          <ListItem
            key={code.code}
            disableGutters
            sx={{ paddingRight: 12 }}
            secondaryAction={
              <ConfirmButton
                confirm
                confirmProps={{
                  color: 'error',
                  disabled: busy,
                  action: t('productRegistrationCodes.revokeAction', 'Revoke Code'),
                  title: t('productRegistrationCodes.revokeTitle', 'Revoke registration code?'),
                  children: (
                    <>
                      <Notice severity="error" gutterBottom fullWidth>
                        {t(
                          'productRegistrationCodes.revokeBody',
                          "Devices can no longer register with this code. Devices already registered aren't affected. This can't be undone."
                        )}
                      </Notice>
                      {endsServiceIds}
                    </>
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
              primary={codeText(code, { label: t('productRegistrationCodes.previous', 'Previous'), color: 'grayDark' })}
              secondary={
                <>
                  {t('productRegistrationCodes.stillWorks', 'Still registers devices')}
                  {' · '}
                  {issued(t('productRegistrationCodes.issued', 'Issued'), code.created)}
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
          disabled: busy,
          action: revokePrevious
            ? t('productRegistrationCodes.replaceAndRevokeAction', 'Replace and Revoke')
            : t('productRegistrationCodes.replaceAction', 'Replace Code'),
          title: t('productRegistrationCodes.replaceTitle', 'Replace registration code?'),
          children: (
            <>
              <Typography variant="body2" gutterBottom>
                {revokePrevious
                  ? t('productRegistrationCodes.replaceBodyRevoke', {
                      code: currentCode,
                      defaultValue:
                        'The new code goes in the registration command. {{code}} and any older code stop registering devices now.',
                    })
                  : t('productRegistrationCodes.replaceBody', {
                      code: currentCode,
                      defaultValue:
                        "The new code goes in the registration command. The current code {{code}} keeps registering devices until you revoke it, so devices still being set up with it aren't cut off.",
                    })}
              </Typography>
              {previous.length > 0 && !revokePrevious && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {t('productRegistrationCodes.replaceRevokesPrevious', {
                    count: previous.length,
                    code: previous.map(code => shortCode(code.code)).join(', '),
                    defaultValue_one: 'The older code {{code}} will be revoked: only two codes stay in use.',
                    defaultValue_other: 'The older codes {{code}} will be revoked: only two codes stay in use.',
                  })}
                </Typography>
              )}
              {(previous.length > 0 || revokePrevious) && endsServiceIds}
              <List disablePadding>
                <ListItemCheckbox
                  checked={revokePrevious}
                  label={t('productRegistrationCodes.revokeNow', {
                    code: currentCode,
                    defaultValue: 'Stop {{code}} now too',
                  })}
                  subLabel={t(
                    'productRegistrationCodes.revokeNowHelp',
                    "If it leaked. Devices still being set up with it won't be able to register."
                  )}
                  onClick={setRevokePrevious}
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
        // The dialog's cancel can't reach this state, so each confirm starts unchecked here instead.
        onClickCapture={() => setRevokePrevious(false)}
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
                    secondary={
                      <>
                        {t('productRegistrationCodes.revoked', 'Revoked')} <Timestamp date={new Date(code.revoked!)} />
                      </>
                    }
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

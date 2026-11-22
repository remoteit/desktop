import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material'
import type { IDeviceProduct, IDeviceProductCode } from '../models/products'
import { registrationCodesToRetire } from '../helpers/productCredentials'
import { selectPermissions } from '../selectors/organizations'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { ListItemCheckbox } from './ListItemCheckbox'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ColorChip } from './ColorChip'
import { Duration } from './Duration'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'
import { Gutters } from './Gutters'
import { dispatch } from '../store'

type Props = { product: IDeviceProduct }

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

const codeText = (code: IDeviceProductCode) => (
  <Typography
    variant="body2"
    component="span"
    sx={{ fontFamily: "'Roboto Mono', monospace", overflowWrap: 'anywhere' }}
  >
    {code.code}
  </Typography>
)

const chipColumn = (label: string, color: Color) => (
  <Box sx={{ width: 96, flexShrink: 0, alignSelf: 'flex-start', paddingTop: 0.75 }}>
    <ColorChip label={label} size="small" color={color} variant="contained" />
  </Box>
)

// The newest code in force is the one in the registration command. Products with join keys keep reusable codes
// active until an administrator explicitly revokes them.
export const ProductRegistrationCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [replacing, setReplacing] = useState(false)
  const [revoking, setRevoking] = useState<string>()
  const [revokePrevious, setRevokePrevious] = useState(false)

  // One change at a time: each reads the product again, and two reads in flight could land out of order.
  const busy = replacing || !!revoking
  const codes = product.registrationCodes || []
  const [current, ...previous] = codes.filter(code => !code.revoked)
  const endsServiceIds =
    !codes.some(code => code.revoked) &&
    ' ' +
      t(
        'productRegistrationCodes.endsServiceIds',
        'Revoking a code also stops devices registering with a service ID of this product.'
      )
  const modern = product.joinKeys !== undefined
  const last = !previous.length
  const locked = last && !product.joinKeys?.some(key => key.inForce)
  const replaceRevokes = registrationCodesToRetire(product, revokePrevious).length

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

  const revokeButton = (code: IDeviceProductCode) => (
    <ConfirmButton
      confirm
      confirmProps={{
        color: 'error',
        disabled: busy,
        action: t('productRegistrationCodes.revokeAction', 'Revoke code'),
        title: t('productRegistrationCodes.revokeTitle', 'Revoke registration code?'),
        children: (
          <>
            <Notice severity="error" gutterBottom fullWidth>
              {t(
                'productRegistrationCodes.revokeBody',
                "Devices can no longer register with this code. Devices already registered aren't affected. This can't be undone."
              )}
              {endsServiceIds}
              {code === current && last && (
                <em>
                  {t(
                    'productRegistrationCodes.revokeLastBody',
                    "It is the product's last reusable code: the registration command stops working, and devices register with its join keys and one-time codes."
                  )}
                </em>
              )}
            </Notice>
          </>
        ),
      }}
      size="small"
      variant="text"
      color="danger"
      title={
        code === current && locked
          ? t('productRegistrationCodes.revokeLastCredential', 'Rotate the code or create a join key first: this is the only code in force')
          : modern
            ? t('productRegistrationCodes.revokeAction', 'Revoke code')
            : t('productRegistrationCodes.revoke', 'Revoke')
      }
      loading={revoking === code.code}
      disabled={busy || (modern && !admin) || (code === current && locked)}
      onClick={() => revoke(code.code)}
    />
  )

  const lastUse = (code: IDeviceProductCode) => modern && (
    <>
      {' · '}
      {code.lastUsed ? (
        <>
          {t('productRegistrationCodes.lastUsed', 'Last used')}{' '}
          <Timestamp date={new Date(code.lastUsed)} variant="minutes" />
        </>
      ) : t('productRegistrationCodes.noUse', 'No use recorded')}
    </>
  )

  const replaceButton = (
    <ConfirmButton
      confirm
      confirmProps={{
        color: 'error',
        disabled: busy,
        action: revokePrevious
          ? t('productRegistrationCodes.replaceAndRevokeAction', 'Replace and revoke')
          : t('productRegistrationCodes.replaceAction', 'Replace code'),
        title: t('productRegistrationCodes.replaceTitle', 'Replace registration code?'),
        children: (
          <>
            <Typography variant="body2" gutterBottom>
              {revokePrevious
                ? t(
                    'productRegistrationCodes.replaceBodyRevoke',
                    'The new code goes in the registration command, and the current code stops registering devices now.'
                  )
                : t(
                    'productRegistrationCodes.replaceBody',
                    'The new code goes in the registration command. The current code keeps registering devices until you revoke it.'
                  )}
            </Typography>
            {replaceRevokes > 0 && (
              <Notice severity="error" gutterBottom fullWidth>
                {t('productRegistrationCodes.revokesCodes', {
                  count: replaceRevokes,
                  defaultValue_one:
                    "1 code will be revoked. Devices still being set up with it won't be able to register, and this can't be undone.",
                  defaultValue_other:
                    "{{count}} codes will be revoked. Devices still being set up with them won't be able to register, and this can't be undone.",
                })}
                {endsServiceIds}
              </Notice>
            )}
            {current && <List disablePadding>
              <ListItemCheckbox
                checked={revokePrevious}
                label={t('productRegistrationCodes.revokeNow', 'Revoke the current code now too')}
                subLabel={t('productRegistrationCodes.revokeNowHelp', 'If it leaked.')}
                onClick={setRevokePrevious}
                disableGutters
              />
            </List>}
          </>
        ),
      }}
      size="small"
      variant="text"
      color="grayDark"
      title={t('productRegistrationCodes.replace', 'Replace')}
      loading={replacing}
      disabled={busy || (modern && !admin)}
      onClick={replace}
      // The dialog's cancel can't reach this state, so each confirm starts unchecked here instead.
      onClickCapture={() => setRevokePrevious(false)}
    />
  )

  return (
    <Box sx={{ marginTop: 3 }}>
      <Typography variant="subtitle2" color="textSecondary">
        {modern
          ? t('productRegistrationCodes.reusableTitle', 'Reusable codes')
          : t('productRegistrationCodes.title', 'Codes in use')}
      </Typography>
      {modern && !current && replaceButton}
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {modern
          ? t(
              'productRegistrationCodes.soloDescription',
              'Replacing the code updates the registration command. Earlier codes keep registering devices until you revoke them.'
            )
          : t(
              'productRegistrationCodes.description',
              "Replacing the code updates the command above. Devices already registered aren't affected."
            )}
      </Typography>
      <List dense disablePadding>
        {current && (
          <ListItem
            disableGutters
            sx={{ paddingRight: modern ? 28 : 16 }}
            secondaryAction={
              <>
                {replaceButton}
                {modern && revokeButton(current)}
              </>
            }
          >
            {chipColumn(t('productRegistrationCodes.current', 'Current'), 'primary')}
            <ListItemText
              primary={codeText(current)}
              secondary={
                <>
                  {issued(t('productRegistrationCodes.issued', 'Issued'), current.created)}
                  {lastUse(current)}
                </>
              }
            />
          </ListItem>
        )}
        {previous.map(code => (
          <ListItem
            key={code.code}
            disableGutters
            sx={{ paddingRight: 16 }}
            secondaryAction={revokeButton(code)}
          >
            {chipColumn(t('productRegistrationCodes.previous', 'Previous'), 'grayDark')}
            <ListItemText
              primary={codeText(code)}
              secondary={
                <>
                  {t('productRegistrationCodes.stillWorks', 'Still registers devices')}
                  {' · '}
                  {issued(t('productRegistrationCodes.issued', 'Issued'), code.created)}
                  {lastUse(code)}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

// Rendered outside the page's gutters, as the app's other accordions are, so its heading lines up with the sections above.
export const ProductRevokedCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const revoked = (product.registrationCodes || []).filter(code => code.revoked)
  if (!revoked.length) return null

  return (
    <AccordionMenuItem
      gutters
      subtitle={t('productRegistrationCodes.revokedHistory', {
        total: revoked.length,
        defaultValue: 'Revoked codes ({{total}})',
      })}
    >
      <Gutters top={null} bottom={null}>
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
      </Gutters>
    </AccordionMenuItem>
  )
}

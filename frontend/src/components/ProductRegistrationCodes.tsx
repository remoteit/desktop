import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material'
import { IDeviceProduct, IDeviceProductCode } from '../models/products'
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

// The newest code in force is the one in the registration command. The app keeps one more in use, the code it replaced, so
// devices still being set up with it are not cut off (products.rotateCode); graphql itself keeps any number.
export const ProductRegistrationCodes: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
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
  const replaceRevokes = previous.length + (revokePrevious ? 1 : 0)

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

  const replaceButton = (
    <ConfirmButton
      confirm
      confirmProps={{
        color: 'error',
        disabled: busy,
        action: revokePrevious
          ? t('productRegistrationCodes.replaceAndRevokeAction', 'Replace and Revoke')
          : t('productRegistrationCodes.replaceAction', 'Replace Code'),
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
            <List disablePadding>
              <ListItemCheckbox
                checked={revokePrevious}
                label={t('productRegistrationCodes.revokeNow', 'Revoke the current code now too')}
                subLabel={t('productRegistrationCodes.revokeNowHelp', 'If it leaked.')}
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
      title={t('productRegistrationCodes.replace', 'Replace')}
      loading={replacing}
      disabled={busy}
      onClick={replace}
      // The dialog's cancel can't reach this state, so each confirm starts unchecked here instead.
      onClickCapture={() => setRevokePrevious(false)}
    />
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
          <ListItem disableGutters sx={{ paddingRight: 16 }} secondaryAction={replaceButton}>
            {chipColumn(t('productRegistrationCodes.current', 'Current'), 'primary')}
            <ListItemText
              primary={codeText(current)}
              secondary={issued(t('productRegistrationCodes.issued', 'Issued'), current.created)}
            />
          </ListItem>
        )}
        {previous.map(code => (
          <ListItem
            key={code.code}
            disableGutters
            sx={{ paddingRight: 16 }}
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
                        {endsServiceIds}
                      </Notice>
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
            {chipColumn(t('productRegistrationCodes.previous', 'Previous'), 'grayDark')}
            <ListItemText
              primary={codeText(code)}
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

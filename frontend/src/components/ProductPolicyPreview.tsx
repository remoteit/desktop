import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Chip, CircularProgress, Collapse, Link, List, ListItem, ListItemText, Typography } from '@mui/material'
import { ProductItem, ProductPreview, summarize } from '../services/productPolicy'
import { itemName, summaryLines } from '../helpers/productPolicyHelper'
import { Notice } from './Notice'

// The preview as it is read: undefined while it is, a refusal in graphql's words, or what each device would get.
export type PreviewState = ProductPreview[] | { reason: string } | undefined

type Props = {
  preview: PreviewState
  single?: boolean // one device's: its items named, not counted
}

// The devices listed one by one at most, beyond the summary.
const LISTED = 50

/* What a change of product, or of a product's level, would do (services/productPolicy): what is lost first — only a
   move into, or a raise to, enforced removes anything —, then what is given, locked to the product, or becomes the
   device's own. For one device each item is named; for a product's devices it is said in brief, and each device's
   changes are there to open. The lifecycle warning, where the move takes a device from persistent to ephemeral. */
export const ProductPolicyPreview: React.FC<Props> = ({ preview, single }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!preview)
    return (
      <Box display="flex" alignItems="center" gap={1} data-preview="loading">
        <CircularProgress size={16} />
        <Typography variant="body2" color="textSecondary">
          {t('productPreview.reading', 'Reading what changes…')}
        </Typography>
      </Box>
    )

  if ('reason' in preview)
    return (
      <Box data-preview="refused">
        <Notice severity="error" fullWidth>
          {preview.reason || t('productPreview.failed', 'What would change could not be read.')}
        </Notice>
      </Box>
    )

  const warnings = [...new Set(preview.map(each => each.warning).filter((w): w is string => !!w))]
  const changed = preview.filter(
    each => each.added.length + each.locked.length + each.removed.length + each.unlocked.length
  )

  return (
    <Box data-preview="ready">
      {warnings.map(warning => (
        <Notice key={warning} severity="warning" fullWidth gutterBottom>
          {warning}
        </Notice>
      ))}
      {!changed.length ? (
        <Typography variant="body2" color="textSecondary" data-preview-nothing>
          {single
            ? t('productPreview.nothingDevice', 'Nothing on the device changes.')
            : t('productPreview.nothing', 'Nothing on its devices changes.')}
        </Typography>
      ) : single ? (
        <Items preview={changed[0]} />
      ) : (
        <>
          {summaryLines(t, summarize(changed)).map(line =>
            line.severity === 'warning' ? (
              <Notice key={line.text} severity="warning" fullWidth gutterBottom>
                {line.text}
              </Notice>
            ) : (
              <Typography key={line.text} variant="body2" gutterBottom data-preview-line>
                {line.text}
              </Typography>
            )
          )}
          <Link component="button" type="button" variant="body2" onClick={() => setOpen(!open)} data-preview-toggle>
            {open
              ? t('productPreview.hideDevices', 'Hide each device')
              : t('productPreview.showDevices', 'Show each device')}
          </Link>
          <Collapse in={open}>
            <List dense disablePadding>
              {changed.slice(0, LISTED).map((each, index) => (
                <ListItem key={each.deviceId || index} disableGutters>
                  <ListItemText
                    primary={each.name || each.deviceId}
                    secondary={<Items preview={each} />}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
            {changed.length > LISTED && (
              <Typography variant="caption" color="textSecondary">
                {t('productPreview.more', { count: changed.length - LISTED, defaultValue: 'and {{count}} more' })}
              </Typography>
            )}
          </Collapse>
        </>
      )}
    </Box>
  )
}

// One device's changes, each group named, its items as chips.
const Items: React.FC<{ preview: ProductPreview }> = ({ preview }) => {
  const { t } = useTranslation()
  const groups: [string, string, ProductItem[], 'warning' | 'default'][] = [
    ['removed', t('productPreview.removed', 'Removed'), preview.removed, 'warning'],
    ['added', t('productPreview.added', 'Added'), preview.added, 'default'],
    ['locked', t('productPreview.locked', 'Locked to the product'), preview.locked, 'default'],
    ['unlocked', t('productPreview.unlocked', 'Becomes its own'), preview.unlocked, 'default'],
  ]
  return (
    <>
      {groups
        .filter(([, , items]) => items.length)
        .map(([key, label, items, color]) => (
          <Box key={key} data-preview-group={key} marginBottom={0.5}>
            <Typography variant="caption" color="textSecondary" component="div">
              {label}
            </Typography>
            {items.map(item => (
              <Chip
                key={`${item.kind}:${item.name}`}
                size="small"
                color={color}
                variant="outlined"
                label={itemName(t, item)}
                sx={{ marginRight: 0.5, marginBottom: 0.5 }}
              />
            ))}
          </Box>
        ))}
    </>
  )
}

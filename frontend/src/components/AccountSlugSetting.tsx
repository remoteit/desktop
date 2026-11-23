import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  FORMER_RESOLVES_DAYS,
  accountSlugAvailable,
  graphQLAccountSlug,
  setAccountSlug,
  validSlug,
} from '../services/subnetNames'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'

/* The account's slug: its part of every one of its devices' DNS names, <name>-<slug>.<domain>. Edited in place, its
   form checked as it is typed and then whether the account can have it (graphql accountSlugAvailable: not reserved,
   nobody else's). Changing it renames every device for everyone; the old slug keeps working for 30 days. On the
   account's own settings (Profile) and an organization's (Settings); graphql decides who may change it. Hidden without
   the device-sessions flag, and where the API does not serve device sessions. */
export const AccountSlugSetting: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const enabled = useDeviceSessions()
  const [slug, setSlug] = useState<string | null>()

  useEffect(() => {
    if (!enabled) return
    let current = true
    graphQLAccountSlug(accountId).then(result => {
      if (current && result !== 'ERROR' && result !== UNSUPPORTED) setSlug(result)
    })
    return () => {
      current = false
    }
  }, [enabled, accountId])

  if (!enabled || slug === undefined) return null

  return (
    <List>
      <ListSubheader>{t('accountSlug.title', 'Device addresses')}</ListSubheader>
      <InlineTextFieldSetting
        required
        icon="globe"
        label={t('accountSlug.label', 'Account slug')}
        value={slug ?? ''}
        displayValue={slug ?? t('accountSlug.none', 'Given when a device is first named')}
        maxLength={32}
        validate={async value => {
          const wanted = value.trim().toLowerCase()
          if (!validSlug(wanted))
            return t(
              'accountSlug.problem',
              '3 to 32 lower case letters, digits and single hyphens, starting and ending with a letter or digit'
            )
          if (wanted === slug) return undefined
          return (await accountSlugAvailable(wanted, accountId)) === false
            ? t('accountSlug.taken', '{{slug}} is taken or reserved', { slug: wanted })
            : undefined
        }}
        helper={value =>
          t('accountSlug.hint', 'Devices are named <name>-{{slug}}', { slug: value.trim().toLowerCase() || '…' })
        }
        onSave={async value => {
          const chosen = await setAccountSlug(value.toString(), accountId)
          if (chosen) setSlug(chosen)
        }}
      />
      <Box
        component="li"
        sx={{ listStyle: 'none', marginLeft: `${spacing.md + LIST_ITEM_ICON_WIDTH}px`, marginRight: `${spacing.xl}px` }}
      >
        <Typography variant="caption" color="textSecondary" component="p">
          {t(
            'accountSlug.about',
            "Every device's address ends in -<slug>. Changing it renames them for everyone. The old slug works for {{days}} days, then stays reserved for six months.",
            { days: FORMER_RESOLVES_DAYS }
          )}
        </Typography>
      </Box>
    </List>
  )
}

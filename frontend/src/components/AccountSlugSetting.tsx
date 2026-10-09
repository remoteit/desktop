import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader, Typography } from '@mui/material'
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
import { Gutters } from './Gutters'

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
      <ListSubheader>{t('accountSlug.title', 'Device DNS names')}</ListSubheader>
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
      <Gutters top={null}>
        <Typography variant="caption" color="textSecondary">
          {t(
            'accountSlug.about',
            "Every device's DNS name ends in -<slug>. Changing it renames all of them for everyone who reaches them; the old slug keeps working for {{days}} days, then is held from anyone else for six months.",
            { days: FORMER_RESOLVES_DAYS }
          )}
        </Typography>
      </Gutters>
    </List>
  )
}

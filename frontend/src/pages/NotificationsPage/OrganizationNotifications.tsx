import React, { useEffect, useState } from 'react'
import { List, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State, store } from '../../store'
import { Avatar } from '../../components/Avatar'
import { Gutters } from '../../components/Gutters'
import { ListItemSetting } from '../../components/ListItemSetting'
import { selectOrganizationOptions } from '../../selectors/organizations'
import { graphQLMutedOrganizations } from '../../services/graphQLRequest'
import { graphQLSetOrganizationNotifications } from '../../services/graphQLMutation'
import { inOrder } from '../../helpers/inOrder'
import { latestWins } from '../../helpers/latestWins'

// Module-level and keyed by account, as models/user.ts: a sign-out drops queued writes, and a remount loads behind them.
const writes = inOrder(() => store.getState().auth.user?.id)
const newest = latestWins()
let stale = false

// IDs are compared upper-cased, as the API matches them.
const normalize = (id: string) => id.toUpperCase()

const load = async () => {
  const result = await graphQLMutedOrganizations()
  if (result === 'ERROR') return null
  const list: string[] | undefined = result.data?.data?.login?.notificationSettings?.mutedOrganizations
  return list ? list.map(normalize) : null
}

export const OrganizationNotifications: React.FC = () => {
  const { t } = useTranslation()
  const organizations = useSelector(selectOrganizationOptions)
  const pushNotifications = useSelector((state: State) => state.user.notificationSettings.pushNotifications)
  const [muted, setMuted] = useState<string[] | null>(null)
  const hasOrganizations = organizations.length > 0

  useEffect(() => {
    if (hasOrganizations) writes(load).then(list => setMuted(list ?? null))
  }, [hasOrganizations])

  if (!muted || !hasOrganizations) return null

  const toggle = async (id: string) => {
    const key = normalize(id)
    const enabled = muted.includes(key)
    const isNewest = newest.take()
    setMuted(list => list && (enabled ? list.filter(m => m !== key) : [...list, key]))
    if ((await writes(() => graphQLSetOrganizationNotifications(id, enabled))) === 'ERROR') stale = true
    // An older toggle reloading would put back a switch that a later write is still changing; a failed
    // reload keeps the switches as they are (and the list stale) rather than hiding the section.
    if (!stale || !isNewest()) return
    const list = await writes(load)
    if (list && isNewest()) {
      stale = false
      setMuted(list)
    }
  }

  return (
    <>
      <Typography variant="subtitle1">{t('settings.notifyOrganizations', 'Organizations')}</Typography>
      <Gutters top={null} bottom={null}>
        <Typography variant="caption" color="text.secondary" component="p">
          {t('settings.notifyOrganizationsHelp', 'Mobile push about the devices of each organization you belong to.')}
        </Typography>
      </Gutters>
      <List>
        {organizations.map(({ id, email, name }) => (
          <ListItemSetting
            key={id}
            icon={<Avatar email={email} fallback={name} size={28} />}
            label={name || email}
            toggle={!muted.includes(normalize(id))}
            disabled={pushNotifications === false}
            onClick={() => toggle(id)}
          />
        ))}
      </List>
    </>
  )
}

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ListItem, ListItemIcon, ListItemText, Switch } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLRoleSshAdmin, graphQLSetRoleSshAdmin } from '../services/graphQLDeviceSsh'
import { Icon } from './Icon'

/* A role's SSH admin setting (services/graphQLDeviceSsh): its members are admins (sudo) on their own SSH accounts on
   the devices the role reaches. Saved as it is switched, apart from the role's form. Nothing where the API has none. */
export const RoleSshAdmin: React.FC<{ roleId: string; disabled?: boolean }> = ({ roleId, disabled }) => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const [on, setOn] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOn(null)
    graphQLRoleSshAdmin(accountId, roleId).then(setOn)
  }, [accountId, roleId])

  if (on === null) return null

  const change = async (next: boolean) => {
    setSaving(true)
    if ((await graphQLSetRoleSshAdmin(accountId, roleId, next)) !== 'ERROR') setOn(next)
    setSaving(false)
  }

  return (
    <ListItem>
      <ListItemIcon>
        <Icon name="terminal" size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary={t('roleSshAdmin.title', 'SSH admin')}
        secondary={t(
          'roleSshAdmin.description',
          'Admin (sudo) on their own SSH account on the devices this role reaches'
        )}
      />
      <Switch checked={on} disabled={disabled || saving} onChange={e => change(e.target.checked)} />
    </ListItem>
  )
}

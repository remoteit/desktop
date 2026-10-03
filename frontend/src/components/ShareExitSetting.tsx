import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from '@mui/material'
import { graphQLSetShareExit, graphQLShareExit } from '../services/graphQLProxy'
import { ListItemSetting } from './ListItemSetting'

/* Whether a person the device is shared with may use it as an exit node: its own grant, never implied by connect
   access (presence-server docs/proxy-plan.md §8). Device sessions only; nothing shows where the API lacks it. */
export const ShareExitSetting: React.FC<{ device: IDevice; email: string }> = ({ device, email }) => {
  const { t } = useTranslation()
  const [exit, setExit] = useState<boolean>()
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const answer = await graphQLShareExit(device.id, email)
    setExit(typeof answer === 'boolean' ? answer : undefined)
  }, [device.id, email])

  useEffect(() => {
    load()
  }, [load])

  if (exit === undefined || !device.permissions.includes('MANAGE')) return null

  return (
    <List>
      <ListItemSetting
        icon="arrow-right-from-bracket"
        label={t('shareExit.label', 'Use as an exit node')}
        subLabel={t('shareExit.hint', 'Send their traffic out through this device, as a VPN would')}
        toggle={exit}
        disabled={saving}
        onClick={async () => {
          setSaving(true)
          if ((await graphQLSetShareExit(device.id, email, !exit)) !== 'ERROR') await load()
          setSaving(false)
        }}
      />
    </List>
  )
}

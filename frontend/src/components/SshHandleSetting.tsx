import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader, Typography } from '@mui/material'
import { graphQLSetSshHandle, graphQLSshHandle, validSshHandle } from '../services/graphQLDeviceSsh'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Gutters } from './Gutters'

/* Your handle (services/graphQLDeviceSsh; presence-server docs/ssh-account-names.md): what your own SSH accounts on
   devices are named by, after the stage's r3 prefix (r3-<handle> on prod) — in place of your email's name. It names
   accounts made from now on; one already made on a device keeps its name. On your Profile. Hidden without the
   device-sessions flag, and where the API does not serve it. */
export const SshHandleSetting: React.FC = () => {
  const { t } = useTranslation()
  const enabled = useDeviceSessions()
  const [handle, setHandle] = useState<string | null>()
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    if (!enabled) return
    let current = true
    graphQLSshHandle().then(result => {
      if (current && result !== undefined) setHandle(result)
    })
    return () => {
      current = false
    }
  }, [enabled])

  if (!enabled || handle === undefined) return null

  return (
    <List>
      <ListSubheader>{t('sshHandle.title', 'SSH accounts on devices')}</ListSubheader>
      <InlineTextFieldSetting
        icon="terminal"
        label={t('sshHandle.label', 'Handle')}
        value={handle ?? ''}
        displayValue={handle ?? t('sshHandle.none', "Your email's name")}
        maxLength={16}
        validate={value => {
          const wanted = value.trim().toLowerCase()
          if (wanted === '' || validSshHandle(wanted)) return undefined
          return t('sshHandle.problem', '1 to 16 lower case letters, digits, _ and -, starting with a letter or digit')
        }}
        helper={value =>
          t('sshHandle.hint', 'Your own account on a device: the r3 prefix, then {{handle}}', {
            handle: value.trim().toLowerCase() || t('sshHandle.emailName', "your email's name"),
          })
        }
        onSave={async value => {
          const result = await graphQLSetSshHandle(value.toString())
          if ('reason' in result) setProblem(result.reason || t('sshHandle.failed', 'Could not set your handle'))
          else {
            setProblem(undefined)
            setHandle(result.handle)
          }
        }}
      />
      <Gutters top={null}>
        <Typography variant="caption" color={problem ? 'error' : 'textSecondary'}>
          {problem ??
            t(
              'sshHandle.about',
              'Names your own account on the devices you are given SSH access to. Accounts already made keep their names; a device admin may name yours on their device.'
            )}
        </Typography>
      </Gutters>
    </List>
  )
}

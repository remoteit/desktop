import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { Dispatch, State } from '../store'
import { Confirm } from './Confirm'

export const AgentSwitchConfirm: React.FC = () => {
  const { t } = useTranslation()
  const { auth } = useDispatch<Dispatch>()
  const owner = useSelector((state: State) => state.auth.agentOwner)
  const account = useSelector((state: State) => state.auth.user?.email)
  if (!owner) return null
  const target = account ?? t('agentSwitch.thisAccount', 'this account')

  return (
    <Confirm
      open
      title={t('agentSwitch.title', "Switch this computer's agent?")}
      action={t('agentSwitch.switch', 'Switch agent')}
      denyLabel={t('agentSwitch.keep', 'Go back to {{owner}}', { owner: owner.username })}
      onConfirm={() => auth.switchAgent()}
      onDeny={() => auth.keepAgent()}
    >
      <Typography variant="body2">
        {t(
          'agentSwitch.message',
          "This computer's Remote.It agent is signed in as {{owner}}. Switching moves it to {{account}}, and the connections {{owner}} saved on this computer are removed.",
          { owner: owner.username, account: target }
        )}
      </Typography>
    </Confirm>
  )
}

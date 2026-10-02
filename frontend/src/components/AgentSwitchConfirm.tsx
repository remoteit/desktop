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
  if (!owner) return null

  return (
    <Confirm
      open
      title={t('agentSwitch.title', 'Switch accounts?')}
      action={t('agentSwitch.switch', 'Switch')}
      denyLabel={t('agentSwitch.keep', 'Go back to {{owner}}', { owner: owner.username })}
      onConfirm={() => auth.switchAgent()}
      onDeny={() => auth.keepAgent()}
    >
      <Typography variant="body2">
        {t('agentSwitch.message', "You'll lose the connections you've set up on this computer.")}
      </Typography>
    </Confirm>
  )
}

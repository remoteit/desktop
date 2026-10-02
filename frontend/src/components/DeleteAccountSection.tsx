import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Typography, Button, Stack } from '@mui/material'
import { State } from '../store'
import { isPersonal } from '../models/plans'
import { getUserId } from '../selectors/state'
import { graphQLFetchOwnedDevices } from '../services/graphQLDevice'
import { RemoveRemoteitDialog } from './RemoveRemoteitDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { OwnedDevices } from './OwnedDevicesList'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { Link } from './Link'

function useOwnedDevices(userId: string, thisId?: string) {
  const [owned, setOwned] = useState<OwnedDevices>()

  useEffect(() => {
    if (!userId) return
    let current = true
    graphQLFetchOwnedDevices(userId, thisId).then(result => {
      if (!current || result === 'ERROR') return
      const login = result.data?.data?.login
      const devices = login?.account?.devices
      setOwned({
        total: devices?.total || 0,
        devices: devices?.items || [],
        thisDeviceOwned: !!login?.device?.some((device: { owner?: { id: string } }) => device.owner?.id === userId),
      })
    })
    return () => {
      current = false
    }
  }, [userId, thisId])

  return owned
}

export const DeleteAccountSection: React.FC = () => {
  const { t } = useTranslation()
  const userId = useSelector(getUserId)
  const thisId = useSelector((state: State) => state.backend.thisId)
  const paidPlan = useSelector((state: State) => !isPersonal(state))
  const members = useSelector(
    (state: State) => state.organization.accounts[userId]?.members.filter(m => m.user.id !== userId).length || 0
  )
  const owned = useOwnedDevices(userId, thisId)
  const [dialog, setDialog] = useState<'remove' | 'delete'>()
  const close = () => setDialog(undefined)

  return (
    <Gutters>
      {paidPlan && (
        <Notice severity="info" fullWidth gutterBottom>
          {t('deleteAccountSection.paidPlanNotice', 'You have a paid subscription plan.')}{' '}
          <Link to="/account/plans">
            {t('deleteAccountSection.paidPlanCancel', 'Cancel it before deleting your account.')}
          </Link>
        </Notice>
      )}
      {members > 0 && (
        <Notice severity="info" fullWidth gutterBottom>
          {t('deleteAccountSection.membersNotice', {
            count: members,
            defaultValue: 'Your organization has {{count}} other members.',
          })}{' '}
          <Link to="/organization/members">
            {t('deleteAccountSection.membersRemove', 'Transfer ownership or remove them before deleting your account.')}
          </Link>
        </Notice>
      )}
      <Typography variant="body2" color="GrayText" gutterBottom>
        {t(
          'deleteAccountSection.description',
          "Deleting your account is immediate and permanent. It doesn't uninstall Remote.It from your devices, so remove it from each device first."
        )}
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" paddingBottom={2} paddingTop={1}>
        <Button variant="contained" size="small" onClick={() => setDialog('remove')}>
          {t('deleteAccountSection.removeButton', 'How to remove Remote.It')}
        </Button>
        <Button color="error" size="small" disabled={paidPlan || members > 0} onClick={() => setDialog('delete')}>
          {t('deleteAccountSection.deleteButton', 'Delete my account')}
        </Button>
      </Stack>
      <RemoveRemoteitDialog open={dialog === 'remove'} owned={owned} thisId={thisId} onClose={close} />
      <DeleteAccountDialog
        open={dialog === 'delete'}
        owned={owned}
        thisId={thisId}
        onShowInstructions={() => setDialog('remove')}
        onClose={close}
      />
    </Gutters>
  )
}

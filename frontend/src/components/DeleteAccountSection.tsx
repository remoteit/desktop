import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Typography, Button, Stack } from '@mui/material'
import { State } from '../store'
import { PERSONAL_PLAN_ID } from '../models/plans'
import { getOwnOrganization } from '../models/organization'
import { selectRemoteitLicense } from '../selectors/organizations'
import { useOwnedDevices } from '../hooks/useOwnedDevices'
import { RemoveRemoteitDialog } from './RemoveRemoteitDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { Link } from './Link'

export const DeleteAccountSection: React.FC = () => {
  const { t } = useTranslation()
  const userId = useSelector((state: State) => state.user.id)
  const license = useSelector((state: State) => selectRemoteitLicense(state, state.user.id))
  const members = useSelector((state: State) => getOwnOrganization(state).members)
  const [dialog, setDialog] = useState<'remove' | 'delete'>()
  const [opened, setOpened] = useState(0)
  const owned = useOwnedDevices(!!dialog)
  const paidPlan = !!license && license.plan.id !== PERSONAL_PLAN_ID
  const otherMembers = members.filter(member => member.user.id !== userId).length

  const openDelete = () => {
    setOpened(opened + 1)
    setDialog('delete')
  }
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
      {otherMembers > 0 && (
        <Notice severity="info" fullWidth gutterBottom>
          {t('deleteAccountSection.membersNotice', {
            count: otherMembers,
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
        <Button color="error" size="small" onClick={openDelete}>
          {t('deleteAccountSection.deleteButton', 'Delete my account')}
        </Button>
      </Stack>
      <RemoveRemoteitDialog open={dialog === 'remove'} owned={owned} onClose={close} />
      <DeleteAccountDialog
        key={opened}
        open={dialog === 'delete'}
        owned={owned}
        onShowInstructions={() => setDialog('remove')}
        onClose={close}
      />
    </Gutters>
  )
}

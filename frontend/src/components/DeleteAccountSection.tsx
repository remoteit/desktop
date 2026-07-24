import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { Typography, Box, Button, TextField, List } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ListItemCheckbox } from '../components/ListItemCheckbox'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { spacing } from '../styling'

interface DeleteAccountSectionProps {
  user?: IUser
  paidPlan?: boolean
  deleteAccount?: boolean
}

export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({
  user,
  paidPlan = false,
  deleteAccount,
}) => {
  const connections = useSelector((state: State) => state.connections.all).slice(0, 5)
  const [confirm, setConfirm] = React.useState<boolean>(false)
  const [contact, setContact] = React.useState<boolean>(true)
  const [reasons, setReasons] = React.useState<string[]>([])
  const [body, setBody] = React.useState<string>('')
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()

  const REASONS = [
    t('deleteAccountSection.reasonUnsupportedDevice', 'My device isn’t supported'),
    t('deleteAccountSection.reasonInstallDifficult', 'Installation was too difficult'),
    t('deleteAccountSection.reasonConnectionQuality', 'Connection quality or performance issues'),
    t('deleteAccountSection.reasonCouldntGetOnline', 'Couldn’t get my device online'),
    t('deleteAccountSection.reasonCouldntConnect', 'Couldn’t connect'),
    t('deleteAccountSection.reasonCost', 'Cost of service'),
    t('deleteAccountSection.reasonAnotherAccount', 'Have another account'),
    t('deleteAccountSection.reasonTooHard', 'Too hard to use'),
    t('deleteAccountSection.reasonNotExpected', 'Not what I thought it was'),
    t('deleteAccountSection.reasonNotUsing', 'Not using it anymore'),
    t('deleteAccountSection.reasonUsingSomethingElse', 'Using something else'),
  ]

  const handleDelete = () => setConfirm(true)
  const handleReason = (reason: string) => {
    if (reasons.includes(reason)) setReasons(reasons.filter(r => r !== reason))
    else setReasons([...reasons, reason])
  }
  const handleConfirm = () => {
    dispatch.feedback.set({
      subject: `Account deletion request for ${user?.email}`,
      body,
      data: {
        email: user?.email,
        userId: user?.id,
        reasons,
        contactMe: contact ? 'Yes' : 'No',
        createdDate: user?.created?.toLocaleString(navigator.language, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        lastConnections: connections,
      },
      snackbar: t('deleteAccountSection.snackbar', 'Your account delete request has been sent.'),
    })
    dispatch.feedback.sendFeedback()
    dispatch.ui.set({ deleteAccount: true })
    setConfirm(false)
  }
  return (
    <Gutters>
      {paidPlan ? (
        <Notice severity="info" fullWidth gutterBottom>
          {t('deleteAccountSection.paidPlanNotice', 'You have a paid subscription plan.')}{' '}
          <em>{t('deleteAccountSection.paidPlanDowngrade', 'Please downgrade to Personal to request an account deletion.')}</em>
        </Notice>
      ) : (
        <>
          <Typography variant="body2" color="GrayText" gutterBottom>
            {t(
              'deleteAccountSection.description',
              'If you no longer want/need your Remote.It account, you can request an account deletion. Once your delete request is processed, all your account information is removed permanently.'
            )}
          </Typography>
          <Box pb={2}>
            <Button color="error" size="small" variant="contained" disabled={deleteAccount} onClick={handleDelete}>
              {t('deleteAccountSection.deleteButton', 'Delete my account')}
            </Button>
            <Confirm
              open={confirm}
              onConfirm={handleConfirm}
              color="error"
              maxWidth="sm"
              onDeny={() => setConfirm(false)}
              title={
                <>
                  <Box
                    sx={{
                      fontSize: 105,
                      lineHeight: '1em',
                      float: 'right',
                      marginRight: -1,
                      marginTop: -1,
                      marginBottom: -3,
                      marginLeft: 1,
                    }}
                  >
                    {/* Pleading Emoji */}
                    &#x1F97A;
                  </Box>
                  {t('deleteAccountSection.confirmTitle', 'Why do you want to delete your account?')}
                  <Typography variant="body2" marginTop={1}>
                    <i>{t('deleteAccountSection.confirmSorry', 'We are sorry to see you go!')} </i>
                    <br />
                    {t('deleteAccountSection.confirmHelp', "Please help us improve by telling us why it didn't work out.")}
                  </Typography>
                </>
              }
              action={t('common.delete', 'Delete')}
              disabled={body.length < 2 && reasons.length < 1}
            >
              <List disablePadding>
                {REASONS.map((reason, i) => (
                  <ListItemCheckbox
                    key={i}
                    label={reason}
                    height={spacing.xl}
                    checked={reasons.includes(reason)}
                    disableGutters
                    onClick={() => {
                      handleReason(reason)
                    }}
                  />
                ))}
              </List>
              <TextField
                multiline
                fullWidth
                autoFocus
                rows={3}
                label={t('deleteAccountSection.otherReasonLabel', 'Other Reason')}
                variant="filled"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <ListItemCheckbox
                disableGutters
                label={t('deleteAccountSection.contactMeLabel', "I'm open to having someone contact me about my feedback.")}
                checked={contact}
                onClick={checked => setContact(checked)}
              />
              <Notice severity="error" fullWidth gutterTop>
                {t(
                  'deleteAccountSection.permanentWarning',
                  'I understand that this is permanent and that accounts and related devices can not be recovered.'
                )}
              </Notice>
            </Confirm>
          </Box>
          <Typography variant="caption">
            {t('deleteAccountSection.turnaround', 'Deletion requests take 3 to 5 business days to complete.')}
          </Typography>
        </>
      )}
    </Gutters>
  )
}

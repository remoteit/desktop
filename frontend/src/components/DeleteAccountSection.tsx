import React from 'react'
import { Typography, Box, Button, TextField, List } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { ListItemCheckbox } from '../components/ListItemCheckbox'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { spacing } from '../styling'

const REASONS = [
  "My device isn't supported",
  'Installation was too difficult',
  'Connection quality or performance issues',
  'Couldn’t get my device online',
  'Couldn’t connect',
  'Too hard to use',
  'Not what I thought it was',
  'Not using it anymore',
  'Using something else',
  'Have another account',
]
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
  const [confirm, setConfirm] = React.useState<boolean>(false)
  const [contact, setContact] = React.useState<boolean>(false)
  const [reasons, setReasons] = React.useState<string[]>([])
  const [body, setBody] = React.useState<string>('')
  const dispatch = useDispatch<Dispatch>()

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
      },
      snackbar: 'Your account delete request has been sent.',
    })
    dispatch.feedback.sendFeedback()
    dispatch.ui.set({ deleteAccount: true })
    setConfirm(false)
  }
  return (
    <Gutters>
      {paidPlan ? (
        <Notice severity="info" fullWidth gutterBottom>
          You have a paid subscription plan. <em>Please downgrade to Personal to request an account deletion.</em>
        </Notice>
      ) : (
        <>
          <Typography variant="body2" color="GrayText" gutterBottom>
            If you no longer want/need your Remote.It account, you can request an account deletion. Once your delete
            request is processed, all your account information is removed permanently.
          </Typography>
          <Box pb={2}>
            <Button color="error" size="small" variant="contained" disabled={deleteAccount} onClick={handleDelete}>
              Delete my account
            </Button>
            <Confirm
              open={confirm}
              onConfirm={handleConfirm}
              color="error"
              maxWidth="sm"
              onDeny={() => setConfirm(false)}
              title="Why do you want to delete your account?"
              action="Delete"
              disabled={body.length < 2 && reasons.length < 1}
            >
              <Typography variant="body2">
                Help us improve by telling us why you want to delete your account.
                <br />
                <i>We are sorry to see you go! </i>
              </Typography>
              <List>
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
                label="Other Reason"
                variant="filled"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <ListItemCheckbox
                disableGutters
                label="I'm open to having someone contact me about my feedback."
                checked={contact}
                onClick={checked => setContact(checked)}
              />
              <Notice severity="error" fullWidth gutterTop>
                I understand that this is permanent and that accounts and related devices can not be recovered.
              </Notice>
            </Confirm>
          </Box>
          <Typography variant="caption">Deletion requests take 3 to 5 business days to complete.</Typography>
        </>
      )}
    </Gutters>
  )
}

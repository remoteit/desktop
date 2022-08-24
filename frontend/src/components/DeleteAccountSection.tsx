import React from 'react'
import { Typography, Box, Button, TextField } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { ListItemCheckbox } from '../components/ListItemCheckbox'
import { Gutters } from '../components/Gutters'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'

interface DeleteAccountSectionProps {
  user?: IUser
  paidPlan?: boolean
}

export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({ user, paidPlan = false }) => {
  const [confirm, setConfirm] = React.useState<boolean>(false)
  const [contact, setContact] = React.useState<boolean>(false)
  const [body, setBody] = React.useState<string>('')
  const dispatch = useDispatch<Dispatch>()

  const handleDelete = () => setConfirm(true)
  const handleConfirm = () => {
    dispatch.feedback.set({
      subject: `Account deletion request for ${user?.email}`,
      body,
      data: { email: user?.email, userId: user?.id, contactMe: contact ? 'Yes' : 'No' },
      snackbar: 'Your account delete request has been sent.',
    })
    dispatch.feedback.sendFeedback()
    setConfirm(false)
  }
  return (
    <Gutters>
      <Typography variant="body2" color="GrayText" gutterBottom>
        If you no longer want/need your remote.it account, you can request an account deletion. Once your delete request
        is processed, all your account information is removed permanently.
      </Typography>
      {paidPlan ? (
        <Notice severity="warning" fullWidth gutterBottom>
          You have a paid subscription plan. Please delete or transfer your devices before making an account deletion
          request.
        </Notice>
      ) : (
        <Box pb={2}>
          <Button color="error" size="small" variant="contained" disabled={!!body.length} onClick={handleDelete}>
            Delete my account
          </Button>
          <Confirm
            open={confirm}
            onConfirm={handleConfirm}
            color="error"
            maxWidth="sm"
            onDeny={() => setConfirm(false)}
            title="Delete account?"
            action="Delete"
            disabled={body.length < 8}
          >
            <Typography variant="body2" gutterBottom>
              <b>We are sorry so see you go! </b>
              <br />
              Please tell us why you want to delete your account.
              <em> Thank you!</em>
            </Typography>
            <TextField
              multiline
              fullWidth
              autoFocus
              rows={3}
              required
              label="Reason"
              variant="filled"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <ListItemCheckbox
              disableGutters
              label="I'm interested in having someone contact me about my feedback."
              checked={contact}
              onClick={checked => setContact(checked)}
            />
            <Notice severity="danger" fullWidth gutterTop>
              I understand that this is permanent and that accounts and related devices can not be recovered.
            </Notice>
          </Confirm>
        </Box>
      )}
      <Typography variant="caption">Deletion requests take 3 to 5 business days to complete.</Typography>
    </Gutters>
  )
}

import React from 'react'
import { Typography, Box, Button } from '@material-ui/core'
import { Gutters } from '../components/Gutters'
import { Icon } from '../components/Icon'

interface DeleteAccountSectionProps {
  email?: string
  paidPlan?: boolean
}

export const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({ email, paidPlan = false }) => {
  // TODO: Allow them to delete even if on a paid plan (downgrade their plan for them)
  const deleteAccount = () => {
    window.location.href = encodeURI(
      `mailto:support@remote.it?subject=Delete my remote.it account&body=Please delete my account: ${email} 
       \n\nI understand that this is permanent and that accounts and related devices can not be recovered.`
    )
  }
  return (
    <Gutters>
      <Typography variant="body2" gutterBottom>
        If you no longer want/need your remote.it account, you can request an account deletion. Once your delete request
        is processed, all your account information is removed permanently.
      </Typography>
      {paidPlan ? (
        <div>
          <Icon name="exclamation-triangle" />
          <strong>
            You have a paid subscription plan. Please delete or transfer your devices before making an account deletion
            request.
          </strong>
        </div>
      ) : (
        <Box pb={2}>
          <Button style={{ color: 'red', borderColor: 'red' }} size="small" variant="outlined" onClick={deleteAccount}>
            Delete my account
          </Button>
        </Box>
      )}
      <Typography variant="caption">Deletion requests take 3 to 5 business days to complete.</Typography>
    </Gutters>
  )
}

import React from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@material-ui/core'

type Props = {
  verificationMethod: string
  changeVerificationMethod: (e: any) => void
  nextVerificationMethod: () => void
  setShowEnableSelection: (e: any) => void
  setShowMFASelection: (e: any) => void
}

export const MFASelectMethod: React.FC<Props> = ({
  verificationMethod,
  changeVerificationMethod,
  nextVerificationMethod,
  setShowEnableSelection,
  setShowMFASelection,
}) => {
  return (
    <Box mt={2}>
      <Typography variant="h3" gutterBottom>
        Choose a verification method:
      </Typography>
      <TextField
        select
        fullWidth
        variant="filled"
        label="Verification Method"
        value={verificationMethod}
        onChange={e => changeVerificationMethod(e.target.value)}
      >
        <MenuItem value="sms">SMS Number</MenuItem>
        <MenuItem value="app">Authenticator app</MenuItem>
      </TextField>
      <Box mt={3}>
        <Button onClick={nextVerificationMethod} color="primary" variant="contained">
          Next
        </Button>
        <Button
          onClick={() => {
            setShowEnableSelection(true)
            setShowMFASelection(false)
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  )
}

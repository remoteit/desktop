import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'

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
  const { t } = useTranslation()
  return (
    <Box mt={2}>
      <Typography variant="h3" gutterBottom>
        {t('mfaSelectMethod.chooseMethod', 'Choose a verification method:')}
      </Typography>
      <TextField
        select
        fullWidth
        variant="filled"
        label={t('mfaSelectMethod.verificationMethod', 'Verification Method')}
        value={verificationMethod}
        onChange={e => changeVerificationMethod(e.target.value)}
      >
        <MenuItem value="sms">{t('mfaSelectMethod.smsNumber', 'SMS Number')}</MenuItem>
        <MenuItem value="app">{t('mfaSelectMethod.authenticatorApp', 'Authenticator app')}</MenuItem>
      </TextField>
      <Box mt={3}>
        <Button onClick={nextVerificationMethod} color="primary" variant="contained">
          {t('mfaSelectMethod.next', 'Next')}
        </Button>
        <Button
          onClick={() => {
            setShowEnableSelection(true)
            setShowMFASelection(false)
          }}
        >
          {t('mfaSelectMethod.cancel', 'Cancel')}
        </Button>
      </Box>
    </Box>
  )
}

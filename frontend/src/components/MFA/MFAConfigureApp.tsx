import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { spacing, radius } from '../../styling'

type Props = {
  email?: string
  totpCode?: string
  loadTotpCode: () => Promise<void>
  totpVerified: boolean
  sendVerifyTotp: (event: any) => void
  setTotpVerificationCode: (event: any) => void
  totpVerificationCode: string
  loading: boolean
  cancel: (event: any) => void
}

export const MFAConfigureApp: React.FC<Props> = ({
  email,
  totpCode,
  loadTotpCode,
  totpVerified,
  sendVerifyTotp,
  setTotpVerificationCode,
  totpVerificationCode,
  loading,
  cancel,
}) => {
  const { t } = useTranslation()
  return (
    <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'start', sm: 'end' }}>
      <Box sx={{ padding: `${spacing.md}px`, backgroundColor: 'alwaysWhite.main', borderRadius: `${radius.sm}px` }}>
        <QRCodeSVG value={`otpauth://totp/remoteit:${email}?secret=${totpCode}&issuer=remote.it`} />
      </Box>
      <Box ml={3}>
        <Typography variant="body1" gutterBottom>
          {t('mfaConfigureApp.scanInstructions', 'Scan this QR Code with your Authenticator app.')}
        </Typography>
        <Typography variant="h4">{t('mfaConfigureApp.code', { code: totpCode, defaultValue: 'Code: {{code}}' })}</Typography>
        <Button color="primary" variant="contained" size="small" onClick={() => loadTotpCode()}>
          {t('mfaConfigureApp.generateNewCode', 'Generate new QR Code')}
        </Button>
        {!totpVerified && (
          <form onSubmit={sendVerifyTotp}>
            <Box mt={3} display="flex" alignItems="center">
              <TextField
                required
                variant="filled"
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                label={t('mfaConfigureApp.verificationCodeLabel', 'Verification Code')}
                onChange={e => setTotpVerificationCode(e.currentTarget.value.trim())}
                value={totpVerificationCode}
              />
              &nbsp; &nbsp;
              <Button
                disabled={!totpVerificationCode || totpVerificationCode.length < 6}
                variant="contained"
                color="primary"
                type="submit"
              >
                {loading ? t('mfaConfigureApp.processing', 'Processing...') : t('mfaConfigureApp.submit', 'Submit')}
              </Button>
              <Button onClick={cancel}>{t('common.cancel', 'Cancel')}</Button>
            </Box>
          </form>
        )}
      </Box>
    </Box>
  )
}


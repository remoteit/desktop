import React from 'react'
import QRCode from 'qrcode.react'
import { Box, Button, TextField, Typography, Link } from '@material-ui/core'

type Props = {
  email?: string
  totpCode: string | null
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
  return (
    <Box mt={2}>
      <Typography variant="body1">Scan the QR below with your preferred Authenticator app to configure.</Typography>
      {totpCode && (
        <Box>
          <QRCode value={`otpauth://totp/AWSCognito:${email}?secret=${totpCode}&issuer=remote.it`}></QRCode>
          <Typography variant="h4">Code: {totpCode}</Typography>
          <Link onClick={() => loadTotpCode()}>Generate new QR Code</Link>
        </Box>
      )}
      {!totpVerified && (
        <form onSubmit={sendVerifyTotp} style={{ maxWidth: '360px' }}>
          <Box mt={3}>
            <TextField
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              required
              onChange={e => setTotpVerificationCode(e.currentTarget.value.trim())}
              value={totpVerificationCode}
              placeholder="Enter verification code"
            />
          </Box>
          <Box mt={3}>
            <Button disabled={!totpVerificationCode || totpVerificationCode.length < 6} type="submit">
              {loading ? 'Processing...' : 'Submit'}
            </Button>
            <Button onClick={cancel}>Cancel</Button>
          </Box>
        </form>
      )}
    </Box>
  )
}

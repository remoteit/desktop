import React from 'react'
import QRCode from 'qrcode.react'
import { Box, Button, TextField } from '@material-ui/core'

type Props = {
  email?: string
  lastCode: string
  loadLastCode: () => Promise<void>
  totpVerified: boolean
  sendVerifyTotp: (event: any) => void
  setTotpVerificationCode: (event: any) => void
  totpVerificationCode: string
  setShowEnableSelection: (event: any) => void
  setShowAuthenticatorConfig: (event: any) => void
}

export const MFAConfigureApp: React.FC<Props> = ({
  email,
  lastCode,
  loadLastCode,
  totpVerified,
  sendVerifyTotp,
  setTotpVerificationCode,
  totpVerificationCode,
  setShowEnableSelection,
  setShowAuthenticatorConfig,
}) => {
  return (
    <Box mt={2}>
      <p>
        <b>Scan the QR below with your preferred Authenticator app to configure.</b>
      </p>
      {lastCode && (
        <Box>
          <QRCode value={'otpauth://totp/AWSCognito:' + email + '?secret=' + lastCode + '&issuer=remote.it'}></QRCode>
          <p>
            <b>{'Code: ' + lastCode}</b>
          </p>
          <div>
            <a
              onClick={() => {
                loadLastCode()
              }}
            >
              Generate new QR Code
            </a>
          </div>
        </Box>
      )}
      {!totpVerified && (
        <>
          <div>
            <form onSubmit={sendVerifyTotp} style={{ maxWidth: '360px' }}>
              <Box mt={3}>
                <TextField
                  required
                  onChange={e => setTotpVerificationCode(e.currentTarget.value.trim())}
                  value={totpVerificationCode}
                  style={{ marginRight: 3 }}
                  variant='outlined'
                  placeholder="Enter verification code" />
              </Box>
              <Box mt={3}>
                <Button
                  disabled={totpVerificationCode === '' || totpVerificationCode.length < 6}
                  type="submit"
                  variant="contained"
                  style={{ borderRadius: 3 }}
                >
                  Submit
                </Button>
                <Button
                  onClick={() => {
                    setShowEnableSelection(true)
                    setShowAuthenticatorConfig(false)
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </div>
        </>
      )}
    </Box>
  )
}

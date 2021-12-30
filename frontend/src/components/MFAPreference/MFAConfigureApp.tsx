import React from 'react'
import QRCode from 'qrcode.react'
import { Box, Button, Input } from '@material-ui/core'

type Props = {
  email?: string
  totpCode: string
  loadTotpCode: () => Promise<void>
  totpVerified: boolean
  sendVerifyTotp: (event: any) => void
  setTotpVerificationCode: (event: any) => void
  totpVerificationCode: string
  setShowEnableSelection: (event: any) => void
  setShowAuthenticatorConfig: (event: any) => void
}

export const MFAConfigureApp: React.FC<Props> = ({
  email,
  totpCode,
  loadTotpCode,
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
      {totpCode && (
        <Box>
          <QRCode value={'otpauth://totp/AWSCognito:' + email + '?secret=' + totpCode + '&issuer=remote.it'}></QRCode>
          <p>
            <b>{'Code: ' + totpCode}</b>
          </p>
          <div>
            <a
              onClick={() => {
                loadTotpCode()
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
                <Input
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  required
                  onChange={e => setTotpVerificationCode(e.currentTarget.value.trim())}
                  value={totpVerificationCode}
                  className="mr-sm"
                  placeholder='Enter verification code'
                />
              </Box>
              <Box mt={3}>
                <Button
                  disabled={totpVerificationCode === '' || totpVerificationCode.length < 6}
                  type="submit"
                  variant='contained'
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

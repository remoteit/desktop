import React from 'react'
import QRCode from 'qrcode.react'
import { makeStyles, Box, Button, TextField, Typography, Chip } from '@material-ui/core'
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
  const css = useStyles()

  return (
    <Box mt={3} display="flex" alignItems="end">
      <Box className={css.qrcode}>
        <QRCode value={`otpauth://totp/AWSCognito:${email}?secret=${totpCode}&issuer=remote.it`} />
      </Box>
      <Box ml={3}>
        <Typography variant="body1" gutterBottom>
          Scan this QR Code with your Authenticator app.
        </Typography>
        <Typography variant="h4">Code: {totpCode}</Typography>
        <Chip
          variant="outlined"
          color="primary"
          size="small"
          label="Generate new QR Code"
          onClick={() => loadTotpCode()}
        ></Chip>
        {!totpVerified && (
          <form onSubmit={sendVerifyTotp}>
            <Box mt={3} display="flex" alignItems="center">
              <TextField
                required
                variant="filled"
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                label="Verification Code"
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
                {loading ? 'Processing...' : 'Submit'}
              </Button>
              <Button onClick={cancel}>Cancel</Button>
            </Box>
          </form>
        )}
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  qrcode: {
    padding: spacing.md,
    backgroundColor: palette.alwaysWhite.main,
    borderRadius: radius,
  },
}))

import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../AuthLayout'
import { Link } from '../../../components/Link'
import { Icon } from '../../../components/Icon'
import { ResendFunc } from '../../types'
export type SignUpVerifyProps = {
  email: string
  onResend: ResendFunc
  fullWidth?: boolean
}

export function SignUpVerify({ email, onResend, fullWidth }: SignUpVerifyProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <AuthLayout i18nKey="pages.forgot-password-verify.title" back fullWidth={fullWidth}>
      <Box mt={4}>
        <Typography color="textSecondary" variant="body2">
          {t('pages.forgot-password-verify.verification-link-message')}
        </Typography>
      </Box>
      <Box mt={1}>
        <Typography variant="caption">{email}</Typography>
      </Box>
      <Box mt={4} textAlign="right">
        <Button to="/sign-in" component={Link}>
          {t('global.action.continue-signup')}
          <Icon name="arrow-right" inline />
        </Button>
      </Box>
      <Box mt={1} mb={3} textAlign="left">
        <Typography variant="caption">
          {t('pages.verify-account.verification-received-message')}
          <br />
          {t('pages.verify-account.check-spam')}
          <Link onClick={() => onResend(email)}>{t('pages.verify-account.resend-confirmation')}</Link>
        </Typography>
      </Box>
    </AuthLayout>
  )
}

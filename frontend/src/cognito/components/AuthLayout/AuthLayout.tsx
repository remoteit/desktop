import React from 'react'
import { Box, Stack, Tooltip, IconButton } from '@mui/material'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SplashScreen } from '../SplashScreen'
import { PageHeading } from '../PageHeading'
import { Icon } from '../../../components/Icon'

export type AuthLayoutProps = {
  children: React.ReactNode
  i18nKey?: string
  showLogo?: boolean
  back?: boolean
  backLink?: string
  fullWidth?: boolean
}

export function AuthLayout({ children, i18nKey, showLogo, back, backLink, fullWidth }: AuthLayoutProps): JSX.Element {
  const { t } = useTranslation('cognito')
  const history = useHistory()

  let logo: null | React.ReactElement = null
  if (showLogo) {
    logo = <SplashScreen />
  }

  return (
    <Box mx="auto" pt={2} width={fullWidth ? '85%' : '50%'}>
      <Stack alignItems="center">{logo}</Stack>
      {i18nKey && (
        <Box mb={4}>
          <PageHeading>
            {!!back && (
              <Tooltip title="back">
                <IconButton
                  sx={{ position: 'absolute', marginLeft: '-60px', marginTop: '-10px' }}
                  onClick={() => (backLink ? history.push(backLink) : history.goBack())}
                >
                  <Icon fixedWidth name="chevron-left" size="lg" />
                </IconButton>
              </Tooltip>
            )}
            {t(i18nKey)}
          </PageHeading>
        </Box>
      )}
      {children}
    </Box>
  )
}

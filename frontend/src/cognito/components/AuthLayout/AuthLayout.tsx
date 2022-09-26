import React from 'react'
import { Box, Tooltip, IconButton } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SplashScreen } from '../SplashScreen'
import { PageHeading } from '../PageHeading'
import { Icon } from '../../../components/Icon'

export type AuthLayoutProps = {
  children: React.ReactNode
  i18nKey?: string
  notice?: React.ReactNode
  showLogo?: boolean
  back?: boolean
  backLink?: string
  fullWidth?: boolean
}

export function AuthLayout({
  children,
  i18nKey,
  notice,
  showLogo,
  back,
  backLink,
  fullWidth,
}: AuthLayoutProps): JSX.Element {
  const { t } = useTranslation()
  const history = useHistory()
  const css = useStyles()

  let logo: null | React.ReactElement = null
  if (showLogo) {
    logo = <SplashScreen />
  }

  return (
    <>
      {logo}
      {notice}
      <Box ml="auto" mr="auto" pt={2} width={fullWidth ? '85%' : '50%'}>
        {i18nKey && (
          <Box mb={4}>
            <PageHeading>
              {!!back && (
                <Tooltip title="back">
                  <IconButton
                    className={css.back}
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
    </>
  )
}
const useStyles = makeStyles({
  back: {
    position: 'absolute',
    marginLeft: -60,
    marginTop: -10,
  },
})

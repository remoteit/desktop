import React from 'react'
import { useTranslation } from 'react-i18next'
import { State } from '../store'
import { Typography, Divider } from '@mui/material'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Gutters } from '../components/Gutters'

export const AccessKeyPage: React.FC = () => {
  const { t } = useTranslation()
  const { apiKey } = useSelector((state: State) => ({
    apiKey: state.keys?.apiKey,
  }))

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('accessKeyPage.title', 'Access Keys')}</Title>
          </Typography>
        </>
      }
    >
      <AccountAccessKey />
      <Divider variant="inset" />
      <Typography variant="subtitle1">{t('accessKeyPage.developer', 'Developer')}</Typography>
      <Gutters bottom="xl">
        <Typography variant="body2" gutterBottom>
          {t('accessKeyPage.description', 'This is your unique Developer API key to use and access Remote.It APIs.')}
          <br />
          <em>{t('accessKeyPage.doNotShare', 'Do not share it with anyone.')}</em>
        </Typography>
        <CopyCodeBlock label={t('accessKeyPage.apiKey', 'API Key')} value={apiKey} hideCopyLabel />
      </Gutters>
    </Container>
  )
}

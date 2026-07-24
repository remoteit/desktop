import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import { selectOwnLicenses } from '../models/plans'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const LicensingPage: React.FC = () => {
  const { t } = useTranslation()
  const { licenses, limits } = useSelector(selectOwnLicenses)
  return (
    <Container
      gutterBottom
      header={<Typography variant="h1">{t('licensingPage.title', 'License')}</Typography>}
      bodyProps={{ gutterTop: true }}
    >
      <LicensingSetting licenses={licenses} limits={limits} />
    </Container>
  )
}

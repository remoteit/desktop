import React from 'react'
import { Typography } from '@mui/material'
import { selectOwnLicenses } from '../models/plans'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const LicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector(selectOwnLicenses)
  return (
    <Container gutterBottom header={<Typography variant="h1">License</Typography>} bodyProps={{ gutterTop: true }}>
      <LicensingSetting licenses={licenses} limits={limits} />
    </Container>
  )
}

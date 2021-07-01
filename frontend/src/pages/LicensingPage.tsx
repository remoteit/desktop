import React, { useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { LicensingSetting } from '../components/LicensingSetting'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const LicensingPage: React.FC = () => {
  useEffect(() => {
    analyticsHelper.page('LicensingPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Licensing</Title>
        </Typography>
      }
    >
      <LicensingSetting />
    </Container>
  )
}

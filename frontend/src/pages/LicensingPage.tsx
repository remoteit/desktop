import React, { useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { LicensingSetting } from '../components/LicensingSetting'
import { Container } from '../components/Container'
import analyticsHelper from '../helpers/analyticsHelper'

export const LicensingPage: React.FC = () => {
  useEffect(() => {
    analyticsHelper.page('LicensingPage')
  }, [])

  return (
    <Container gutterBottom header={<Typography variant="h1">Licensing</Typography>}>
      <LicensingSetting />
    </Container>
  )
}

import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { selectLicenses } from '../models/licensing'
import { Typography } from '@material-ui/core'
import { LicensingSetting } from '../components/LicensingSetting'
import { Container } from '../components/Container'
import analyticsHelper from '../helpers/analyticsHelper'

export const LicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector((state: ApplicationState) => selectLicenses(state))
  const membership = useSelector((state: ApplicationState) => state.accounts.membership)

  useEffect(() => {
    analyticsHelper.page('LicensingPage')
  }, [])

  return (
    <Container gutterBottom header={<Typography variant="h1">Licensing</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
      {membership.map(m => (
        <LicensingSetting
          licenses={m.organization.licenses}
          title={m.organization.licenses.length ? `${m.organization.name} licensing` : undefined}
        />
      ))}
    </Container>
  )
}

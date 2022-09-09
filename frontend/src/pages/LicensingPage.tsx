import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Divider, Typography } from '@mui/material'
import { LicensingSetting } from '../components/LicensingSetting'
import { memberOrganization } from '../models/organization'
import { selectOwnLicenses } from '../models/plans'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import analyticsHelper from '../helpers/analyticsHelper'

export const LicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector((state: ApplicationState) => selectOwnLicenses(state))
  const { memberships, organizations } = useSelector((state: ApplicationState) => ({
    memberships: state.accounts.membership,
    organizations: state.organization.accounts,
  }))

  useEffect(() => {
    analyticsHelper.page('LicensingPage')
  }, [])

  return (
    <Container gutterBottom header={<Typography variant="h1">Licensing</Typography>}>
      {!!memberships.length ? <Typography variant="subtitle1">Personal</Typography> : <br />}
      <LicensingSetting licenses={licenses} limits={limits} />
      {memberships.reduce((list: JSX.Element[], m) => {
        const organization = memberOrganization(organizations, m.account.id)
        if (organization.licenses.length)
          list.push(
            <React.Fragment key={organization.id}>
              <Divider variant="inset" />
              <Typography variant="subtitle1">{organization.name}</Typography>
              <LicensingSetting licenses={organization.licenses} />
            </React.Fragment>
          )
        return list
      }, [])}
    </Container>
  )
}

import React from 'react'
import { ApplicationState } from '../store'
import { Divider, Typography } from '@mui/material'
import { selectOwnLicenses } from '../models/plans'
import { LicensingSetting } from '../components/LicensingSetting'
import { selectOrganization } from '../selectors/organizations'
import { IOrganizationState } from '../models/organization'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const LicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector(selectOwnLicenses)
  const organizations = useSelector((state: ApplicationState) =>
    state.accounts.membership.reduce((o: IOrganizationState[], m) => {
      const organization = selectOrganization(state, m.account.id)
      if (organization.licenses.length) o.push(organization)
      return o
    }, [])
  )

  return (
    <Container gutterBottom header={<Typography variant="h1">Licensing</Typography>}>
      {!!organizations.length ? <Typography variant="subtitle1">Personal</Typography> : <br />}
      <LicensingSetting licenses={licenses} limits={limits} />
      {organizations.map(o => (
        <React.Fragment key={o.id}>
          <Divider variant="inset" />
          <Typography variant="subtitle1">{o.name}</Typography>
          <LicensingSetting licenses={o.licenses} />
        </React.Fragment>
      ))}
    </Container>
  )
}

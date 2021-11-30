import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Divider, Typography } from '@material-ui/core'
import { LicensingSetting } from '../components/LicensingSetting'
import { selectLicenses } from '../models/licensing'
import { useSelector } from 'react-redux'
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
      {!!membership.length ? <Typography variant="subtitle1">Personal</Typography> : <br />}
      <LicensingSetting licenses={licenses} limits={limits} />
      {membership.reduce((list: JSX.Element[], m) => {
        if (m.organization.licenses.length)
          list.push(
            <React.Fragment key={m.organization.id}>
              <Divider variant="inset" />
              <Typography variant="subtitle1">{m.organization.name}</Typography>
              <LicensingSetting licenses={m.organization.licenses} />
            </React.Fragment>
          )
        return list
      }, [])}
    </Container>
  )
}

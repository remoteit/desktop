import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Typography } from '@material-ui/core'
import { selectPermissions } from '../models/organization'
import { OrganizationGuestList } from '../components/OrganizationGuestList'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationGuestsPage: React.FC = () => {
  const { permissions } = useSelector((state: ApplicationState) => {
    return {
      permissions: selectPermissions(state),
    }
  })

  useEffect(() => {
    analyticsHelper.page('OrganizationGuestsPage')
  }, [])

  if (!permissions?.includes('MANAGE'))
    return (
      <Body center>
        <Typography variant="body2" color="textSecondary">
          Please contact the organization owner to request device manager privileges.
        </Typography>
      </Body>
    )

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Guests</Title>
          </Typography>
          <Gutters bottom="lg">
            <Typography variant="body2" color="textSecondary">
              Users that have devices directly shared to them.
            </Typography>
          </Gutters>
        </>
      }
    >
      <OrganizationGuestList />
    </Container>
  )
}

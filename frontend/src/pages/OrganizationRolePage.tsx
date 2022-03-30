import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { List, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationRolePage: React.FC = () => {
  const { roleID } = useParams<{ roleID?: string }>()
  const { role } = useSelector((state: ApplicationState) => ({
    role: state.organization.roles.find(r => r.id === roleID),
  }))

  useEffect(() => {
    analyticsHelper.page('OrganizationRolePage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{role?.name} Role</Title>
        </Typography>
      }
    >
      <List>
        <pre>{JSON.stringify(role, null, 2)}</pre>
      </List>
    </Container>
  )
}

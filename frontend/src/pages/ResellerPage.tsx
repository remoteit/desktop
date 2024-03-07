import React from 'react'
import { Redirect } from 'react-router-dom'
import { Dispatch } from '../store'
import { Typography, List } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { CustomerList } from '../components/CustomerList'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const ResellerPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const dispatch = useDispatch<Dispatch>()

  if (!permissions?.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Reseller</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">Customers</Typography>
      <CustomerList
        customers={[
          { id: 1, name: 'Customer 1', email: 'customer1@email.com' },
          { id: 2, name: 'Customer 2', email: 'customer2@email.com' },
          { id: 3, name: 'Customer 3', email: 'customer3@email.com' },
          { id: 4, name: 'Customer 4', email: 'customer4@email.com' },
          { id: 5, name: 'Customer 5', email: 'customer5@email.com' },
        ]}
      />
      <Typography variant="subtitle1">Contact</Typography>
      <List>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label="Organization Name"
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
    </Container>
  )
}

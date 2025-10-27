import React from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Redirect, Link } from 'react-router-dom'
import { selectCustomer, selectOrganization } from '../selectors/organizations'
import { Typography, Button } from '@mui/material'
import { LicensingSetting } from '../components/LicensingSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { FormDisplay } from '../components/FormDisplay'
import { BillingUI } from '../components/BillingUI'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const CustomerPage: React.FC = () => {
  const { userID = '' } = useParams<{ userID: string }>()
  const dispatch = useDispatch<Dispatch>()
  const organization = useSelector(selectOrganization)
  const customer = useSelector((state: State) => selectCustomer(state, undefined, userID))
  const license = customer?.license
  const limits = customer?.limits

  if (!customer) return <Redirect to={{ pathname: '/organization/customer', state: { isRedirect: true } }} />

  const removeCustomer = async () => {
    await dispatch.organization.removeCustomer({ id: organization.id, emails: [customer.email] })
  }

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" marginTop={1} gutterBottom>
          <Title>
            <Avatar email={customer?.email} marginRight={16} />
            {customer?.email}
          </Title>
          <DeleteButton
            title="Remove"
            warning={`You are removing the customer ”${customer.email}” from ${organization.name}.`}
            onDelete={removeCustomer}
          />
        </Typography>
      }
    >
      <Typography variant="subtitle1" marginRight={3}>
        <Title>License</Title>
        <BillingUI>
          <Button to={`/organization/customer/${userID}/plans`} size="small" variant="contained" component={Link}>
            Update Plan
          </Button>
        </BillingUI>
      </Typography>
      <LicensingSetting licenses={license ? [{ ...license, limits }] : []} />
      <FormDisplay
        icon={<Avatar email={customer?.reseller} size={28} />}
        label="Sales Rep"
        displayValue={customer?.reseller}
        displayOnly
      />
    </Container>
  )
}
